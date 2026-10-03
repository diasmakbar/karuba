import { db, get, ref, runTransaction, update } from "../firebase";
import { MODULE_REGISTRY } from "../lib/modules";
import { runAdvance, runReset, runVerify } from "../lib/modules/contract";
import { roomPath } from "./room";
import type {
  AnyModuleState,
  LocalVarsMap,
  ModuleAnswerMap,
  ModuleId,
  PlayerState,
  RoomState,
} from "../types/db-schema";

export type ModuleOutcome = "SOLVED" | "STRIKE";

/**
 * Single write entry point for module interaction (rule 13: the answer IS the localVars
 * mutation). Verifies locally against pure module logic, then writes:
 * correct -> new localVars (+ isSolved when the module is finished)
 * wrong   -> optional stage reset, then a strike transaction
 */
export async function submitModuleAnswer(
  code: string,
  playerId: string,
  state: AnyModuleState,
  answer: ModuleAnswerMap[ModuleId],
): Promise<ModuleOutcome> {
  const definition = MODULE_REGISTRY[state.moduleId];
  const correct = runVerify(definition, state.localVars, answer);
  const path = `${roomPath(code)}/players/${playerId}/activeModules/${state.moduleId}`;

  if (!correct) {
    await update(ref(db, path), { localVars: runReset(definition, state.localVars) });
    await recordStrike(code, playerId, definition.name);
    return "STRIKE";
  }

  const advanced = runAdvance(definition, state.localVars, answer);
  const finished = advanced === null;
  await update(ref(db, path), {
    isSolved: finished,
    localVars: (advanced ?? state.localVars) as LocalVarsMap[ModuleId],
  });
  if (finished) await checkLevelComplete(code);
  return "SOLVED";
}

/**
 * Record a strike on the whole room. Uses a transaction because RTDB rules allow any player
 * to write strikeCount, and two players can strike in the same second.
 */
export async function recordStrike(code: string, playerId: string, moduleName: string): Promise<void> {
  const outcome = await runTransaction(ref(db, `${roomPath(code)}/strikeCount`), (current) =>
    typeof current === "number" ? current + 1 : 1,
  );
  const strikeCount = outcome.snapshot.val() as number | null;

  const roomSnapshot = await get(ref(db, roomPath(code)));
  const room = roomSnapshot.exists() ? (roomSnapshot.val() as RoomState) : null;
  const maxStrikes = room?.maxStrikes ?? 0;

  await update(ref(db, roomPath(code)), {
    lastStrike: { playerId, moduleName, at: Date.now() },
    ...(maxStrikes > 0 && typeof strikeCount === "number" && strikeCount >= maxStrikes
      ? { status: "GAME_OVER" }
      : null),
  });
}

/**
 * Called by every client after a solved write. When the whole board is cleared, the room moves to
 * `VICTORY` on the final level, or to `LEVEL_CLEARED` so the host can deal the next level.
 * Idempotent: a second caller sees the status already changed and does nothing.
 */
export async function checkLevelComplete(code: string): Promise<void> {
  const snapshot = await get(ref(db, roomPath(code)));
  if (!snapshot.exists()) return;
  const room = snapshot.val() as RoomState;
  if (room.status !== "PLAYING") return;

  const players = Object.values(room.players ?? {}) as PlayerState[];
  const modules = players.flatMap((player) => Object.values(player.activeModules ?? {}) as AnyModuleState[]);
  if (modules.length === 0) return;
  if (!modules.every((moduleState) => moduleState.isSolved)) return;

  const isFinalLevel = room.level >= room.totalLevels;
  await update(ref(db, roomPath(code)), { status: isFinalLevel ? "VICTORY" : "LEVEL_CLEARED" });
}

/** Called by the client whose clock hits zero first; idempotent. */
export async function expireRoom(code: string): Promise<void> {
  await update(ref(db, roomPath(code)), { status: "GAME_OVER" });
}

/** Persist live module state that changes as the owner works (valves, sliders, holds). */
export async function patchModuleVars(
  code: string,
  playerId: string,
  state: AnyModuleState,
  vars: LocalVarsMap[ModuleId],
): Promise<void> {
  await update(ref(db, `${roomPath(code)}/players/${playerId}/activeModules/${state.moduleId}`), {
    localVars: vars,
  });
}

export function solvedCount(player: PlayerState | null | undefined): number {
  if (!player?.activeModules) return 0;
  return Object.values(player.activeModules).filter((moduleState) => moduleState.isSolved).length;
}

export function totalModules(players: PlayerState[]): number {
  return players.reduce((sum, player) => sum + Object.keys(player.activeModules ?? {}).length, 0);
}

export function solvedModules(players: PlayerState[]): number {
  return players.reduce(
    (sum, player) => sum + Object.values(player.activeModules ?? {}).filter((m) => m.isSolved).length,
    0,
  );
}
