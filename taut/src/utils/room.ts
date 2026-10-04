import { db, get, ref, requireUid, set, update } from "../firebase";
import { DIFFICULTIES, MIN_PLAYERS_TO_START, randomRoomCode } from "../lib/gameConfig";
import { createRng, type Rng } from "../lib/rng";
import { ALL_MODULE_IDS, MODULE_REGISTRY } from "../lib/modules";
import type {
  AnyModuleState,
  Difficulty,
  ModuleId,
  ModuleState,
  PlayerState,
  RoomState,
} from "../types/db-schema";

export const roomPath = (code: string): string => `games/taut/${code}`;

function createPlayer(uid: string, name: string): PlayerState {
  return {
    id: uid,
    name: name.trim() || "Operative",
    joinedAt: Date.now(),
    isReady: false,
    informant1Id: "",
    informant2Id: "",
    activeModules: {},
  };
}

/** Firebase RTDB drops empty objects, so read maps through this. */
export function asRecord<T>(value: unknown): Record<string, T> {
  return (value ?? {}) as Record<string, T>;
}

export function playerList(room: RoomState | null): PlayerState[] {
  return Object.values(asRecord<PlayerState>(room?.players)).sort((a, b) => a.joinedAt - b.joinedAt);
}

export function generateModuleState<K extends ModuleId>(
  rng: Rng,
  id: K,
  difficulty: Difficulty,
): ModuleState<K> {
  return { moduleId: id, isSolved: false, localVars: MODULE_REGISTRY[id].generate(rng, difficulty) };
}

/**
 * Deal **one distinct module per player** for the current level. The 15-module pool is large
 * enough that each player's module stays unique in the normal 3-6 player case.
 */
export function buildModulePlan(
  rng: Rng,
  playerIds: readonly string[],
  difficulty: Difficulty,
): Map<string, AnyModuleState> {
  const pool = rng.shuffle(ALL_MODULE_IDS);
  const plan = new Map<string, AnyModuleState>();
  playerIds.forEach((playerId, index) => {
    const id = pool[index % pool.length];
    plan.set(playerId, generateModuleState(rng, id, difficulty) as unknown as AnyModuleState);
  });
  return plan;
}

/**
 * Balanced informant network (definition §3). For a cyclic shift `p[i] -> p[i+1]` every player
 * provides Info 1 to exactly one other and receives exactly one; a second, independent shift
 * gives the Info-2 edges. Each player's two informants are therefore always distinct and never
 * themselves — provided there are at least 3 players (which the lobby enforces).
 */
export function assignInformants(
  rng: Rng,
  ids: readonly string[],
): Map<string, [string, string]> {
  const order = rng.shuffle(ids);
  const n = order.length;
  // Two independent cyclic shifts with different step sizes so the two informants never coincide.
  const step1 = 1;
  const step2 = Math.max(2, Math.floor(n / 2)) % n || 2 % n || 1;
  const secondStep = step2 === 0 ? 1 : step2;
  // Ensure the two shifts differ for small n (n >= 3). Fall back to +1 and +2 rotation.
  const s1 = step1 % n;
  const s2 = (secondStep === s1 ? s1 + 1 : secondStep) % n;
  const assignment = new Map<string, [string, string]>();
  order.forEach((self, index) => {
    const informant1 = order[(index + s1) % n];
    const informant2 = order[(index + s2) % n];
    assignment.set(self, [informant1, informant2]);
  });
  return assignment;
}

/** Informant ids for a single owner — used by the lobby/room UI helpers. */
export function informantsFor(room: RoomState, playerId: string): [string, string] {
  const player = room.players?.[playerId];
  return [player?.informant1Id ?? "", player?.informant2Id ?? ""];
}

/** Build the per-player state writes for one level (used by startGame and advanceLevel). */
export function levelWrites(
  rng: Rng,
  players: readonly PlayerState[],
  timePerLevelSeconds: number,
  difficulty: Difficulty,
): Record<string, unknown> {
  const ids = players.map((player) => player.id);
  const plan = buildModulePlan(rng, ids, difficulty);
  const informants = assignInformants(rng, ids);

  const updates: Record<string, unknown> = {
    status: "PLAYING",
    globalEndTime: Date.now() + timePerLevelSeconds * 1000,
  };

  for (const player of players) {
    const [informant1Id, informant2Id] = informants.get(player.id) ?? ["", ""];
    updates[`players/${player.id}/informant1Id`] = informant1Id;
    updates[`players/${player.id}/informant2Id`] = informant2Id;
    updates[`players/${player.id}/isReady`] = false;
    // Write activeModules as ONE whole-object value. Replacing it wholesale clears any stale
    // module from a previous level; you must not combine `activeModules = null` with
    // `activeModules/<id>` in the same update() (ancestor + child paths are forbidden).
    const moduleState = plan.get(player.id);
    updates[`players/${player.id}/activeModules`] = moduleState
      ? { [moduleState.moduleId]: moduleState }
      : null;
  }
  return updates;
}

/** Host-only: change the room difficulty while still in the lobby. Visible to everyone live. */
export async function setDifficulty(code: string, difficulty: Difficulty): Promise<void> {
  const uid = await requireUid();
  const snapshot = await get(ref(db, roomPath(code)));
  if (!snapshot.exists()) throw new Error("Room not found.");
  const room = snapshot.val() as RoomState;
  if (room.hostId !== uid) throw new Error("Only the host can change the difficulty.");
  if (room.status !== "LOBBY") throw new Error("The game has already started.");

  const config = DIFFICULTIES[difficulty];
  await update(ref(db, roomPath(code)), {
    difficulty,
    totalLevels: config.levels,
    maxStrikes: config.maxStrikes,
  });
}

/** Create a room keyed by a 6-digit code so it can be read out loud across the table. */
export async function createRoom(name: string, difficulty: Difficulty = "STANDARD"): Promise<string> {
  const uid = await requireUid();
  let code = "";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = randomRoomCode();
    const existing = await get(ref(db, roomPath(candidate)));
    if (!existing.exists()) {
      code = candidate;
      break;
    }
  }
  if (!code) throw new Error("Could not allocate a room code. Try again.");

  const config = DIFFICULTIES[difficulty];
  const room: RoomState = {
    id: code,
    hostId: uid,
    status: "LOBBY",
    difficulty,
    level: 0,
    totalLevels: config.levels,
    globalEndTime: 0,
    strikeCount: 0,
    maxStrikes: config.maxStrikes,
    lastStrike: null,
    owners: { [uid]: true },
    players: { [uid]: createPlayer(uid, name) },
  };
  await set(ref(db, roomPath(code)), room);
  return code;
}

/** Join by code, or silently re-enter a room this uid is already part of. */
export async function joinRoom(code: string, name: string): Promise<string> {
  const uid = await requireUid();
  const clean = code.replace(/\D/g, "");
  if (clean.length !== 6) throw new Error("Room codes are 6 digits.");

  const snapshot = await get(ref(db, roomPath(clean)));
  if (!snapshot.exists()) throw new Error(`No room with code ${clean}.`);
  const room = snapshot.val() as RoomState;

  if (room.players?.[uid]) return clean;
  if (room.status !== "LOBBY") throw new Error("That game has already started.");

  await update(ref(db, roomPath(clean)), { [`players/${uid}`]: createPlayer(uid, name) });
  return clean;
}

export async function setReady(code: string, ready: boolean): Promise<void> {
  const uid = await requireUid();
  await update(ref(db, roomPath(code)), { [`players/${uid}/isReady`]: ready });
}

/** Drop this player from a room that is still in the lobby. */
export async function leaveLobby(code: string): Promise<void> {
  const uid = await requireUid();
  await update(ref(db, roomPath(code)), { [`players/${uid}`]: null });
}

/** Host-only: deal level 1, assign informants and start the shared countdown. */
export async function startGame(code: string): Promise<void> {
  const uid = await requireUid();
  const snapshot = await get(ref(db, roomPath(code)));
  if (!snapshot.exists()) throw new Error("Room not found.");

  const room = snapshot.val() as RoomState;
  if (room.hostId !== uid) throw new Error("Only the host can start the game.");
  if (room.status !== "LOBBY") throw new Error("This game has already started.");

  const players = playerList(room);
  if (players.length < MIN_PLAYERS_TO_START) {
    throw new Error(`You need at least ${MIN_PLAYERS_TO_START} players to start.`);
  }

  const rng = createRng();
  const config = DIFFICULTIES[room.difficulty];
  const updates = levelWrites(rng, players, config.timePerLevelSeconds, room.difficulty);
  updates.level = 1;
  updates.totalLevels = config.levels;
  updates.strikeCount = 0;
  updates.lastStrike = null;

  await update(ref(db, roomPath(code)), updates);
}

/** Host-only: deal the next level (re-deal modules, re-roll informants, keep strikes). */
export async function advanceLevel(code: string): Promise<void> {
  const uid = await requireUid();
  const snapshot = await get(ref(db, roomPath(code)));
  if (!snapshot.exists()) throw new Error("Room not found.");

  const room = snapshot.val() as RoomState;
  if (room.hostId !== uid) throw new Error("Only the host can advance the level.");
  if (room.status !== "PLAYING") return;
  if (room.level >= room.totalLevels) return;

  const players = playerList(room);
  const config = DIFFICULTIES[room.difficulty];
  const rng = createRng();
  const updates = levelWrites(rng, players, config.timePerLevelSeconds, room.difficulty);
  updates.level = room.level + 1;

  await update(ref(db, roomPath(code)), updates);
}

/** Reset to the lobby so the table can run another round on the same code. */
export async function resetToLobby(code: string): Promise<void> {
  const uid = await requireUid();
  const snapshot = await get(ref(db, roomPath(code)));
  if (!snapshot.exists()) return;
  const room = snapshot.val() as RoomState;
  if (room.hostId !== uid) throw new Error("Only the host can reset the game.");

  const updates: Record<string, unknown> = {
    status: "LOBBY",
    level: 0,
    globalEndTime: 0,
    strikeCount: 0,
    lastStrike: null,
  };
  for (const player of playerList(room)) {
    updates[`players/${player.id}/isReady`] = false;
    updates[`players/${player.id}/activeModules`] = null;
  }
  await update(ref(db, roomPath(code)), updates);
}
