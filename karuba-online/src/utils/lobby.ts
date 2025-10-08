import { getPlayerId } from '../lib/playerId'
import { makeRewards } from '../lib/rewards'
import type { Game, Player, Board, ExplorerColor, Branch } from '../lib/types'

export type Layout = {
  explorers: Record<ExplorerColor, { side: Branch; index: number }>
  temples: { side: Branch; index: number; color: ExplorerColor }[]
}

export function makeRandomLayout(): Layout {
  const colors: ExplorerColor[] = ['blue', 'red', 'yellow', 'brown']
  const shuffle = <T,>(arr: T[]) => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
  const pickK = (pool: number[], k: number) => shuffle(pool).slice(0, k)

  const colsShuffled = shuffle(colors)
  const topBottomColors: ExplorerColor[] = colsShuffled.slice(0, 2)
  const leftRightColors: ExplorerColor[] = colsShuffled.slice(2)

  const topCols = pickK([1, 2, 3, 4, 5, 6], 2)
  const rightRows = pickK([1, 2, 3, 4, 5, 6], 2)
  const leftRows = pickK([1, 2, 3, 4, 5, 6], 2)
  const bottomCols = pickK([1, 2, 3, 4, 5, 6], 2)

  const topTemples = topBottomColors.map((color, i) => ({
    side: 'N' as const,
    index: topCols[i] - 1,
    color,
  }))
  const rightTemples = leftRightColors.map((color, i) => ({
    side: 'E' as const,
    index: rightRows[i] - 1,
    color,
  }))

  const explorers = {} as Record<ExplorerColor, { side: Branch; index: number }>
  explorers[leftRightColors[0]] = { side: 'W', index: leftRows[0] - 1 }
  explorers[leftRightColors[1]] = { side: 'W', index: leftRows[1] - 1 }
  explorers[topBottomColors[0]] = { side: 'S', index: bottomCols[0] - 1 }
  explorers[topBottomColors[1]] = { side: 'S', index: bottomCols[1] - 1 }

  return { explorers, temples: [...topTemples, ...rightTemples] }
}

export function emptyBoard(): Board {
  return Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => -1 as const))
}

export function createPlayerPayload(id: string, pname: string, layout: Layout): Player {
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
  } as unknown as Player
}

export function newGameId(): string {
  const num = Math.floor(100000 + Math.random() * 900000).toString()
  return num.slice(0, 3) + ' ' + num.slice(3)
}

export async function handleCreateGame(gameId: string, name: string, playerId: string) {
  const cleanId = gameId.replace(/\s/g, '')
  if (!name.trim()) {
    alert('Enter your name!')
    return
  }
  const rewards = makeRewards()
  const layout = makeRandomLayout()

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
    lastEvent: null,
  }

  const { db, ref, set } = await import('../firebase')
  await set(ref(db, `games/karuba/${cleanId}`), gamePayload)
  await set(
    ref(db, `games/karuba/${cleanId}/players/${playerId}`),
    createPlayerPayload(playerId, name.trim(), layout)
  )

  history.pushState({ playerName: name.trim() }, '', `/room/${cleanId}`)
  dispatchEvent(new PopStateEvent('popstate'))
}

export async function handleJoinGame(gameId: string, name: string, playerId: string) {
  const cleanId = gameId.replace(/\s/g, '')
  if (!name.trim()) {
    alert('Enter your name!')
    return
  }
  if (!/^\d{6}$/.test(cleanId)) {
    alert('Invalid Game ID')
    return
  }

  const { db, ref, get, set, update } = await import('../firebase')
  const gSnap = await get(ref(db, `games/karuba/${cleanId}`))
  if (!gSnap.exists()) {
    alert('Game not found!')
    return
  }

  const layout: Layout = gSnap.val()?.layout
  const pSnap = await get(ref(db, `games/karuba/${cleanId}/players/${playerId}`))
  if (!pSnap.exists()) {
    await set(
      ref(db, `games/karuba/${cleanId}/players/${playerId}`),
      createPlayerPayload(playerId, name.trim(), layout)
    )
    const playersSnap = await get(ref(db, `games/karuba/${cleanId}/players`))
    const count = playersSnap.exists() ? Object.keys(playersSnap.val() || {}).length : 1
    await update(ref(db, `games/karuba/${cleanId}`), { playersCount: count })
  }

  history.pushState({ playerName: name.trim() }, '', `/room/${cleanId}`)
  dispatchEvent(new PopStateEvent('popstate'))
}
