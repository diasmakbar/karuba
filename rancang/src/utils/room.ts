import { update, ref, db, get } from '../firebase/client';
import { getRoundRules, generateAllAttractions } from '../game/config';
import type { Player, Attraction } from '../game/types';

// Start game from lobby
export async function startGame(gameId: string, players: Record<string, Player>) {
  const playerIds = Object.keys(players);
  const playerCount = playerIds.length;
  const roundRules = getRoundRules(playerCount);
  const allAttractions = generateAllAttractions(playerCount);

  // Shuffle attractions
  const shuffledAttractions = [...allAttractions].sort(() => Math.random() - 0.5);

  // Distribute for round 1
  const { land: landCount, attractions: attrCount } = roundRules[0];

  // Generate random tiles for each player
  const maxTiles = Math.min(playerCount + 4, 10) ** 2; // rough estimate
  const tilePool = Array.from({ length: maxTiles }, (_, i) => i + 1);

  const updates: any = {};
  playerIds.forEach((pid, idx) => {
    const start = idx * attrCount;
    const attractions = shuffledAttractions.slice(start, start + attrCount);

    // Random land tiles
    const playerTiles: number[] = [];
    for (let i = 0; i < landCount + 2; i++) { // +2 for selection
      const randomIdx = Math.floor(Math.random() * tilePool.length);
      playerTiles.push(tilePool.splice(randomIdx, 1)[0]);
    }

    updates[`games/rancang/${gameId}/players/${pid}/attractions`] = attractions;
    updates[`games/rancang/${gameId}/players/${pid}/tiles`] = playerTiles;
  });

  // Update game status
  updates[`games/rancang/${gameId}/status`] = 'distributing';
  updates[`games/rancang/${gameId}/statusText`] = 'Select your land tiles';
  updates[`games/rancang/${gameId}/currentRound`] = 1;

  await update(ref(db), updates);
}

// Player selects tiles
export async function selectTiles(gameId: string, playerId: string, selectedTiles: number[]) {
  await update(ref(db, `games/rancang/${gameId}/players/${playerId}`), {
    tiles: selectedTiles,
  });

  // Check if all players have selected (assume 3 tiles each for simplicity)
  // In real, check if tiles.length === landCount
  // For now, assume done
  await update(ref(db, `games/rancang/${gameId}`), {
    status: 'negotiation',
    statusText: 'Negotiate trades',
    negotiationEndTime: Date.now() + 5 * 60 * 1000, // 5 min
  });
}

// Player builds or removes attraction on tile
export async function updateAttraction(gameId: string, playerId: string, tile: number, attraction: Attraction | null) {
  // Get current builtAttractions, update
  const pRef = ref(db, `games/rancang/${gameId}/players/${playerId}`);
  const snap = await get(pRef);
  const currentPlayer = snap.val() as Player;
  const currentBuilt = currentPlayer.builtAttractions || {};
  const newBuilt = { ...currentBuilt };
  if (attraction) {
    newBuilt[tile] = attraction;
  } else {
    delete newBuilt[tile];
  }
  await update(ref(db, `games/rancang/${gameId}/players/${playerId}`), {
    builtAttractions: newBuilt,
  });
}

// Start negotiation
export async function startNegotiation(gameId: string) {
  await update(ref(db, `games/rancang/${gameId}`), {
    status: 'negotiation',
    statusText: 'Negotiate trades',
    negotiationEndTime: Date.now() + 5 * 60 * 1000,
  });
}

// End negotiation and score
export async function endNegotiation(gameId: string, players: Record<string, Player>) {
  // For now, simple scoring: each attraction gives points based on size
  const updates: any = {};
  Object.values(players).forEach(p => {
    let score = 0;
    p.attractions.forEach(attr => {
      score += attr.size; // 3,4,5 points
    });
    updates[`games/rancang/${gameId}/players/${p.id}/coins`] = (p.coins || 0) + score;
  });

  updates[`games/rancang/${gameId}/status`] = 'scoring';
  updates[`games/rancang/${gameId}/statusText`] = 'Scoring complete';

  await update(ref(db), updates);

  // Auto advance after 10 sec
  setTimeout(() => nextRound(gameId), 10000);
}

// Next round or end game
export async function nextRound(gameId: string) {
  // For simplicity, end after round 1
  await update(ref(db, `games/rancang/${gameId}`), {
    status: 'finished',
    statusText: 'Game Over',
  });
}
