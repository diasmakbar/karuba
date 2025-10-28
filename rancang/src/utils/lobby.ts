import { shuffleDeck } from '../lib/deck';
import { getRandomCityPlans } from '../lib/cityPlans';
import type { Game, Player, PlayerBoard } from '../lib/types';
import { auth, authReady } from "../firebase";

await authReady;

export function emptyPlayerBoard(): PlayerBoard {
  // Generate random pool positions: 3 per street
  const generatePools = (houseCount: number): boolean[] => {
    const pools = Array(houseCount).fill(false);
    const positions = Array.from({ length: houseCount }, (_, i) => i);
    // Shuffle and pick 3 positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    positions.slice(0, 3).forEach(pos => pools[pos] = true);
    return pools;
  };

  const street1Pools = generatePools(10);
  const street2Pools = generatePools(11);
  const street3Pools = generatePools(12);

  return {
    street1: Array(10).fill(null).map((_, i) => ({
      poolPosition: street1Pools[i]
    })),
    street2: Array(11).fill(null).map((_, i) => ({
      poolPosition: street2Pools[i]
    })),
    street3: Array(12).fill(null).map((_, i) => ({
      poolPosition: street3Pools[i]
    })),
  };
}

export function createPlayerPayload(id: string, pname: string, ownerUid: string): Player {
  return {
    id,
    name: pname,
    joinedAt: Date.now(),
    board: emptyPlayerBoard(),
    score: 0,
    tempUsed: 0,
    bisUsed: 0,
    buildingRefusals: 0,
    completedPlans: [],
    actedThisTurn: false,
    readyForNext: false,
  };
}

export function newGameId(): string {
  const num = Math.floor(100000 + Math.random() * 900000).toString();
  return num.slice(0, 3) + ' ' + num.slice(3);
}

export async function handleCreateGame(
  gameId: string,
  name: string,
  playerId: string,
  mode: "classic" | "balanced",
  includeAdvanced: boolean
) {
  const cleanId = gameId.replace(/\s/g, '');
  if (!name.trim()) { alert('Enter your name!'); return; }

  const deck = shuffleDeck();
  const cityPlans = getRandomCityPlans(includeAdvanced);

  const gamePayload: Partial<Game> & any = {
    status: 'waiting',
    statusText: 'Waiting for players to join',
    createdAt: Date.now(),
    hostId: playerId,
    mode,
    includeAdvanced,
    round: 0,
    currentCard: null,
    deck,
    discarded: [],
    cityPlans,
    completedPlans: [],
    playersCount: 1,
  };

  const { db, ref, set, update } = await import('../firebase');
  const uid = auth.currentUser?.uid;
  if (!uid) { alert('Auth not ready'); return; }

  await set(ref(db, `games/welcome/${cleanId}`), gamePayload);

  const playerNode = createPlayerPayload(playerId, name.trim(), uid);
  await update(ref(db, `games/welcome/${cleanId}`), {
    [`players/${playerId}`]: playerNode,
  });

  history.pushState({ playerName: name.trim() }, '', `/room/${cleanId}`);
  dispatchEvent(new PopStateEvent('popstate'));
}

export async function handleJoinGame(gameId: string, name: string, playerId: string) {
  const cleanId = gameId.replace(/\s/g, '');
  if (!name.trim()) { alert('Enter your name!'); return; }
  if (!/^\d{6}$/.test(cleanId)) { alert('Invalid Game ID'); return; }

  const { db, ref, get, update } = await import('../firebase');
  const uid = auth.currentUser?.uid;
  if (!uid) { alert('Auth not ready'); return; }

  const gSnap = await get(ref(db, `games/welcome/${cleanId}`));
  if (!gSnap.exists()) { alert('Game not found!'); return; }

  const gameData = gSnap.val();
  if (gameData.status !== 'waiting') { alert('Game already started!'); return; }

  const pRef = ref(db, `games/welcome/${cleanId}/players/${playerId}`);
  const pSnap = await get(pRef);

  if (!pSnap.exists()) {
    const playerNode = createPlayerPayload(playerId, name.trim(), uid);
    const nextCount = gameData.playersCount + 1;

    await update(ref(db, `games/welcome/${cleanId}`), {
      [`players/${playerId}`]: playerNode,
      [`playersCount`]: nextCount
    });
  }

  history.pushState({ playerName: name.trim() }, '', `/room/${cleanId}`);
  dispatchEvent(new PopStateEvent('popstate'));
}
