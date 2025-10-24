import { getPlayerId } from '../lib/playerId'
import { makeRewards } from '../lib/rewards'
import type { Game, Player, Board, ExplorerColor, Branch } from '../lib/types'
import { getAuth } from "firebase/auth";

const auth = getAuth();

export type Layout = {
  explorers: Record<ExplorerColor, { side: Branch; index: number }>
  temples: { side: Branch; index: number; color: ExplorerColor }[]
}

export function makeRandomLayout(): Layout {
  const colors: ExplorerColor[] = ['red', 'blue', 'yellow', 'brown']
  const shuffle = <T,>(arr: T[]) => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
  const pickK = (pool: number[], k: number) => shuffle(pool).slice(0, k)

  // Pick 4 different positions for each side
  const topCols = pickK([1, 2, 3, 4, 5, 6], 2)  // TOP temples positions
  const rightRows = pickK([1, 2, 3, 4, 5, 6], 2) // RIGHT temples positions
  const leftRows = pickK([1, 2, 3, 4, 5, 6], 2)  // LEFT explorers positions
  const bottomCols = pickK([1, 2, 3, 4, 5, 6], 2) // BOTTOM explorers positions

  // Create diagonal pairing: each temple paired with opposite side explorer
  const templePairs = [
    { templeSide: 'N', templeIndex: topCols[0] - 1, explorerSide: 'S', explorerIndex: bottomCols[1] - 1 }, // TOP left ↔ BOTTOM right
    { templeSide: 'N', templeIndex: topCols[1] - 1, explorerSide: 'S', explorerIndex: bottomCols[0] - 1 }, // TOP right ↔ BOTTOM left
    { templeSide: 'E', templeIndex: rightRows[0] - 1, explorerSide: 'W', explorerIndex: leftRows[1] - 1 }, // RIGHT top ↔ LEFT bottom
    { templeSide: 'E', templeIndex: rightRows[1] - 1, explorerSide: 'W', explorerIndex: leftRows[0] - 1 }, // RIGHT bottom ↔ LEFT top
  ]

  // Shuffle colors and assign to pairs
  const shuffledColors = shuffle(colors)
  const colorPairs = [
    { templeColor: shuffledColors[0], explorerColor: shuffledColors[0] }, // Pair 1: same color
    { templeColor: shuffledColors[1], explorerColor: shuffledColors[1] }, // Pair 2: same color
    { templeColor: shuffledColors[2], explorerColor: shuffledColors[2] }, // Pair 3: same color
    { templeColor: shuffledColors[3], explorerColor: shuffledColors[3] }, // Pair 4: same color
  ]

  // Create temples and explorers based on pairs
  const temples = templePairs.map((pair, i) => ({
    side: pair.templeSide as Branch,
    index: pair.templeIndex,
    color: colorPairs[i].templeColor,
  }))

  const explorers = {} as Record<ExplorerColor, { side: Branch; index: number }>
  templePairs.forEach((pair, i) => {
    explorers[colorPairs[i].explorerColor] = {
      side: pair.explorerSide as Branch,
      index: pair.explorerIndex,
    }
  })

  return { explorers, temples }
}

export function emptyBoard(): Board {
  return Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => -1 as const))
}

export function createPlayerPayload(id: string, pname: string, layout: Layout, ownerUid: string): Player {
  return {
    id,
    name: pname,
    joinedAt: Date.now(),
    board: emptyBoard(),
    usedTiles: {},
    discardedTiles: [],
    explorers: {
      ...Object.fromEntries(
        (['red', 'blue', 'brown', 'yellow'] as ExplorerColor[]).map((c) => [
          c,
          { color: c, onEdge: layout.explorers[c] },
        ])
      ),
    },
    moves: 0,
    score: 0,
    actedForRound: false,
    doneForRound: false,
    lastAction: null,
    goldCount: 0,
    crystalCount: 0,
    claimedRewards: { red: {}, blue: {}, brown: {}, yellow: {} },
    finishedAtRound: null,
    bonusPoints: 0,
    ownerUid: ownerUid
  } as unknown as Player;
}

// export function createPlayerPayload(id: string, pname: string, layout: Layout): Player {
//   return {
//     id,
//     name: pname,
//     joinedAt: Date.now(),
//     board: emptyBoard(),
//     usedTiles: {},
//     discardedTiles: [],
//     explorers: {
//       ...Object.fromEntries(
//         (['red', 'blue', 'brown', 'yellow'] as ExplorerColor[]).map((c) => [
//           c,
//           { color: c, onEdge: layout.explorers[c] },
//         ])
//       ),
//     },
//     moves: 0,
//     score: 0,
//     actedForRound: false,
//     doneForRound: false,
//     lastAction: null,
//     goldCount: 0,
//     crystalCount: 0,
//     claimedRewards: { red: {}, blue: {}, brown: {}, yellow: {} },
//     finishedAtRound: null,
//     bonusPoints: 0,
//   } as unknown as Player
// }

export function newGameId(): string {
  const num = Math.floor(100000 + Math.random() * 900000).toString()
  return num.slice(0, 3) + ' ' + num.slice(3)
}

export async function handleCreateGame(gameId: string, name: string, playerId: string) {
  const cleanId = gameId.replace(/\s/g, '');
  if (!name.trim()) { alert('Enter your name!'); return; }

  const rewards = makeRewards();
  const layout = makeRandomLayout();

  const gamePayload: Partial<Game> & any = {
    status: 'waiting',
    statusText: 'Waiting host to start the game',
    round: 0,
    currentTile: 0,
    playersCount: 1,
    shuffleTurnUid: playerId,
    generateTurnIndex: 0,
    generateTurnUid: '',
    layout,
    rewards,
    templeWins: [],
    lastEvent: null
  };

  const { db, ref, set, update, authReady, get } = await import('../firebase');
  await authReady;
  const { auth } = await import('../firebase');
  const uid = auth.currentUser?.uid;
  if (!uid) { alert('Auth not ready'); return; }

  await set(ref(db, `games/karuba/${cleanId}`), gamePayload);

  const playerNode = createPlayerPayload(playerId, name.trim(), layout, uid);
  await update(ref(db), {
    [`games/karuba/${cleanId}/players/${playerId}`]: playerNode,
    [`games/karuba/${cleanId}/owners/${uid}`]: playerId
  });

  history.pushState({ playerName: name.trim() }, '', `/room/${cleanId}`);
  dispatchEvent(new PopStateEvent('popstate'));
}

export async function handleJoinGame(gameId: string, name: string, playerId: string) {
  const cleanId = gameId.replace(/\s/g, '');
  if (!name.trim()) { alert('Enter your name!'); return; }
  if (!/^\d{6}$/.test(cleanId)) { alert('Invalid Game ID'); return; }

  const { db, ref, get, set, update, authReady } = await import('../firebase');
  await authReady;
  const { auth } = await import('../firebase');
  const uid = auth.currentUser?.uid;
  if (!uid) { alert('Auth not ready'); return; }

  const gSnap = await get(ref(db, `games/karuba/${cleanId}`));
  if (!gSnap.exists()) { alert('Game not found!'); return; }

  const layout: Layout = gSnap.val()?.layout;
  const pRef = ref(db, `games/karuba/${cleanId}/players/${playerId}`);
  const pSnap = await get(pRef);

  if (!pSnap.exists()) {
    const playerNode = createPlayerPayload(playerId, name.trim(), layout, uid);
    const playersSnap = await get(ref(db, `games/karuba/${cleanId}/players`));
    const nextCount = playersSnap.exists() ? Object.keys(playersSnap.val() || {}).length + 1 : 1;

    // fan-out: player + owners + playersCount
    await update(ref(db), {
      [`games/karuba/${cleanId}/players/${playerId}`]: playerNode,
      [`games/karuba/${cleanId}/owners/${uid}`]: playerId,
      [`games/karuba/${cleanId}/playersCount`]: nextCount
    });
  }

  history.pushState({ playerName: name.trim() }, '', `/room/${cleanId}`);
  dispatchEvent(new PopStateEvent('popstate'));
}


// export async function handleCreateGame(gameId: string, name: string, playerId: string) {
//   const cleanId = gameId.replace(/\s/g, '')
//   if (!name.trim()) {
//     alert('Enter your name!')
//     return
//   }
//   const rewards = makeRewards()
//   const layout = makeRandomLayout()

//   const gamePayload: Partial<Game> & any = {
//     status: 'waiting',
//     statusText: 'Waiting host to start the game',
//     round: 0,
//     currentTile: 0,
//     playersCount: 1,
//     shuffleTurnUid: playerId,
//     generateTurnIndex: 0,
//     generateTurnUid: '',
//     layout,
//     rewards,
//     templeWins: [],
//     lastEvent: null,
//   }

//   const { db, ref, set } = await import('../firebase')
//   await set(ref(db, `games/karuba/${cleanId}`), gamePayload)
//   await set(
//     ref(db, `games/karuba/${cleanId}/players/${playerId}`),
//     createPlayerPayload(playerId, name.trim(), layout)
//   )

//   history.pushState({ playerName: name.trim() }, '', `/room/${cleanId}`)
//   dispatchEvent(new PopStateEvent('popstate'))
// }

// export async function handleJoinGame(gameId: string, name: string, playerId: string) {
//   const cleanId = gameId.replace(/\s/g, '')
//   if (!name.trim()) {
//     alert('Enter your name!')
//     return
//   }
//   if (!/^\d{6}$/.test(cleanId)) {
//     alert('Invalid Game ID')
//     return
//   }

//   const { db, ref, get, set, update } = await import('../firebase')
//   const gSnap = await get(ref(db, `games/karuba/${cleanId}`))
//   if (!gSnap.exists()) {
//     alert('Game not found!')
//     return
//   }

//   const layout: Layout = gSnap.val()?.layout
//   const pSnap = await get(ref(db, `games/karuba/${cleanId}/players/${playerId}`))
//   if (!pSnap.exists()) {
//     await set(
//       ref(db, `games/karuba/${cleanId}/players/${playerId}`),
//       createPlayerPayload(playerId, name.trim(), layout)
//     )
//     const playersSnap = await get(ref(db, `games/karuba/${cleanId}/players`))
//     const count = playersSnap.exists() ? Object.keys(playersSnap.val() || {}).length : 1
//     await update(ref(db, `games/karuba/${cleanId}`), { playersCount: count })
//   }

//   history.pushState({ playerName: name.trim() }, '', `/room/${cleanId}`)
//   dispatchEvent(new PopStateEvent('popstate'))
// }
