import { ref, update, get } from "../firebase"
import type { Game, Player, Branch } from "../lib/types"
import { generateTilesMeta } from "../lib/deck"

// Shared utility
export const opp = (b: Branch): Branch => (b === "N" ? "S" : b === "S" ? "N" : b === "E" ? "W" : "E")

// Reward helpers
export const rewardGain = (tileId: number | null | undefined, rewards: Record<number, "gold" | "crystal" | null>) => {
  if (!tileId || !rewards) return 0
  const r = rewards[tileId]
  if (r === "gold") return 2
  if (r === "crystal") return 1
  return 0
}

export const rewardKind = (tileId: number | null | undefined, rewards: Record<number, "gold" | "crystal" | null>) =>
  tileId && rewards ? rewards[tileId] : null

// Explorer position helper
export const isOccupiedByOther = (r: number, c: number, explorers: Record<string, any>, exceptColor?: string) => {
  return Object.values(explorers || {}).some(
    (ex: any) => ex.onBoard && ex.onBoard.r === r && ex.onBoard.c === c && ex.color !== exceptColor
  )
}

// Compute if everyone finished
export const computeEveryoneFinished = async (gameId: string, db: any): Promise<boolean> => {
  const plist = await get(ref(db, `games/karuba/${gameId}/players`))
  const pObj: Record<string, Player> = (plist.val() || {}) as any
  return Object.values(pObj || {}).every((p) => Object.keys(p.explorers || {}).length === 0)
}

// End game logic
export const endGame = async (
  gameId: string,
  players: Record<string, Player>,
  db: any,
  updatesFn?: (updates: Record<string, any>) => void
) => {
  if (!players) {
    await update(ref(db, `games/karuba/${gameId}`), { status: "ended", statusText: "Game ended" })
    return
  }
  const plist = Object.values(players || {})
  const finished = plist
    .filter((p) => p.finishedAtRound != null)
    .sort((a, b) => (a.finishedAtRound ?? 99) - (b.finishedAtRound ?? 99))

  const updates: Record<string, any> = {}
  plist.forEach((p) => {
    let bonus = 0
    if (p.finishedAtRound != null) {
      const baseBonus = Math.min(36 - (p.finishedAtRound as number), 8)
      let placementBonus = 0
      if (finished[0]?.id === p.id) placementBonus = 2
      else if (finished[1]?.id === p.id) placementBonus = 1
      bonus = baseBonus + placementBonus
    }
    updates[`players/${p.id}/bonusPoints`] = bonus
    updates[`players/${p.id}/score`] = (p.score ?? 0) + bonus
  })
  updates["status"] = "ended"
  updates["statusText"] = "Game ended"
  await update(ref(db, `games/karuba/${gameId}`), updates)
}

// Game control handlers
export const onStartOrGenerate = async (game: Game, gameId: string, isHost: boolean, isGenerateTurnOwner: boolean, order: string[], db: any) => {
  if (!game) return
  if (game.status === "waiting") {
    if (!isHost) return
    const tilesMeta = generateTilesMeta()
    const pids = order
    const idxForRound2 = pids.length > 1 ? 1 : 0
    await update(ref(db, `games/karuba/${gameId}`), {
      status: "playing",
      statusText: "Round 1",
      round: 1,
      currentTile: 1,
      generateTurnIndex: idxForRound2,
      generateTurnUid: pids[idxForRound2] || "",
      templeWins: game.templeWins || [],
      tilesMeta,
      lastEvent: null,
    })
    for (const pid of pids) {
      await update(ref(db, `games/karuba/${gameId}/players/${pid}`), {
        actedForRound: false,
        doneForRound: false,
        lastAction: null,
      })
    }
    return
  }
  if (game.status === "playing" && game.round >= 2) {
    if (!isGenerateTurnOwner || game.currentTile !== 0) return
    await update(ref(db, `games/karuba/${gameId}`), {
      currentTile: game.round,
      statusText: `Round ${game.round}`,
    })
  }
}

// These need more context, but I'll add placeholders
// placeTile, discardTile, etc.
// For now, extract the simpler ones.

export const playerNameById = (playerId: string, players: Record<string, Player>) => players[playerId]?.name || "player"

export const waitingLabel = (
  game: Game | null,
  round: number,
  isGenerateTurnOwner: boolean,
  players: Record<string, Player>,
  generateTurnUid: string
) => {
  if (!game) return "Loading..."
  if (game.status === "waiting") return "Waiting host to start the game"
  if (round === 1) return "Place or discard your tile, then move explorers if any"
  if (isGenerateTurnOwner) return "You can generate now"
  return `Waiting for ${players[generateTurnUid]?.name || "player"} to generate tile`
}

export const canGenerate = (game: Game | null, status: string, round: number, isGenerateTurnOwner: boolean, currentTile: number) => {
  if (!game) return false
  return (
    (status === "waiting" ? true : false) || // simplified
    (status === "playing" && round >= 2 && isGenerateTurnOwner && currentTile === 0)
  )
}

export const placeTile = async (r: number, c: number, game: Game, me: Player, playerId: string, gameId: string, db: any) => {
  if (game.currentTile <= 0) return
  if (me.actedForRound) return
  const board = me.board.map((row) => row.slice())
  if (board[r][c] !== -1) return
  board[r][c] = game.currentTile

  await update(ref(db, `games/karuba/${gameId}/players/${playerId}`), {
    board,
    actedForRound: true,
    lastAction: "placed",
    usedTiles: { ...(me.usedTiles || {}), [game.currentTile]: true },
  })
}

export const discardTile = async (tileId: number, branches: Branch[], game: Game, me: Player, playerId: string, gameId: string, db: any) => {
  if (tileId !== game.currentTile) return
  if (me.actedForRound) return
  const gain = branches.length
  await update(db, `games/karuba/${gameId}/players/${playerId}`, {
    moves: (me.moves || 0) + gain,
    lastDiscardDirs: branches,
    actedForRound: true,
    lastAction: "discarded",
    discardedTiles: [...(me.discardedTiles || []), tileId],
    usedTiles: { ...(me.usedTiles || {}), [tileId]: true },
  })
}

export const onReadyNextRound = async (game: Game, me: Player, playerId: string, gameId: string, players: Record<string, Player>, db: any) => {
  if (!me.actedForRound || me.doneForRound) return
  await update(db, `games/karuba/${gameId}/players/${playerId}`, { doneForRound: true })
  await maybeAdvanceRound(game, players, gameId, db)
}

export const maybeAdvanceRound = async (game: Game, players: Record<string, Player>, gameId: string, db: any) => {
  const plist = await get(ref(db, `games/karuba/${gameId}/players`))
  const pObj: Record<string, Player> = (plist.val() || {}) as any
  const activePlayers = Object.values(pObj || {}).filter(p => Object.keys(p.explorers || {}).length > 0)
  const allReady = activePlayers.every((p) => p.doneForRound)
  if (!allReady) return

  const order = Object.values(players || {}).sort((a, b) => a.joinedAt - b.joinedAt).map(p => p.id)
  const nextRound = game.round + 1

  // End if: only if round > 36
  if (nextRound > 36) {
    await endGame(gameId, players, db)
    return
  }

  let nextIdx = game.generateTurnIndex
  if (nextRound !== 2) nextIdx = (game.generateTurnIndex + 1) % order.length

  await update(db, `games/karuba/${gameId}`, {
    round: nextRound,
    currentTile: 0,
    generateTurnIndex: nextIdx,
    generateTurnUid: order[nextIdx] || order[0],
    statusText: `Round ${nextRound} (waiting generate)`,
  })
  for (const pid of order) {
    const p = pObj[pid]
    if (Object.keys(p.explorers || {}).length > 0) {
      await update(db, `games/karuba/${gameId}/players/${pid}`, {
        actedForRound: false,
        doneForRound: false,
        lastAction: null,
      })
    }
  }
}

// More handlers like moveOne and enterTemple are too long to extract now, will do later.
