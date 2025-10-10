import { ref, update, get } from "../firebase"
import type { Game, Player, Branch, ExplorerColor } from "../lib/types"
import { generateTilesMeta } from "../lib/deck"
import { opp } from "./board"

// Re-export opp for backward compatibility
export { opp }

// Reward helpers
export const rewardGain = (tileId: number | null | undefined, rewards: Record<number, ("gold" | "crystal")[] | "gold" | "crystal" | null>) => {
  if (!tileId || !rewards) return 0
  const r = rewards[tileId]
  if (!r) return 0

  // Handle both old format (single value) and new format (array)
  const rewardsArray = Array.isArray(r) ? r : [r]
  return rewardsArray.reduce((sum, reward) => sum + (reward === "gold" ? 2 : reward === "crystal" ? 1 : 0), 0)
}

export const rewardKind = (tileId: number | null | undefined, rewards: Record<number, ("gold" | "crystal")[] | "gold" | "crystal" | null>) => {
  if (!tileId || !rewards) return []
  const r = rewards[tileId]
  if (!r) return []

  // Handle both old format (single value) and new format (array)
  return Array.isArray(r) ? r : [r]
}

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
    let baseBonus = 0
    let placementBonus = 0
    if (p.finishedAtRound != null) {
      baseBonus = Math.min(36 - (p.finishedAtRound as number), 8)
      if (finished[0]?.id === p.id) placementBonus = 2  // 1st place: +2
      else if (finished[1]?.id === p.id) placementBonus = 1  // 2nd place: +1
    }
    const totalBonus = baseBonus + placementBonus
    updates[`players/${p.id}/baseBonus`] = baseBonus
    updates[`players/${p.id}/placementBonus`] = placementBonus
    updates[`players/${p.id}/bonusPoints`] = totalBonus  // Keep for backward compatibility
    updates[`players/${p.id}/score`] = (p.score ?? 0) + totalBonus
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
  await update(ref(db, `games/karuba/${gameId}/players/${playerId}`), {
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
  await update(ref(db, `games/karuba/${gameId}/players/${playerId}`), { doneForRound: true })
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

  await update(ref(db, `games/karuba/${gameId}`), {
    round: nextRound,
    currentTile: 0,
    generateTurnIndex: nextIdx,
    generateTurnUid: order[nextIdx] || order[0],
    statusText: `Round ${nextRound} (waiting generate)`,
  })
  for (const pid of order) {
    const p = pObj[pid]
    if (Object.keys(p.explorers || {}).length > 0) {
      await update(ref(db, `games/karuba/${gameId}/players/${pid}`), {
        actedForRound: false,
        doneForRound: false,
        lastAction: null,
      })
    }
  }
}

export const validateInternalMove = (
  r: number,
  c: number,
  entry: Branch,
  dir: Branch,
  board: number[][],
  tilesMeta: Record<string, { branches: Branch[] }>,
  explorers: Record<ExplorerColor, any>,
  color: ExplorerColor
) => {
  const tid = board[r][c]
  if (tid === -1) { console.warn("[MOVE] no tile at", r, c); return null }
  const meta = tilesMeta[String(tid)]
  if (!meta?.branches?.includes(dir)) { console.warn("[MOVE] current tile has no branch", dir, "at", r, c, "meta:", meta); return null }

  let nr = r, nc = c
  if (dir === "N") nr = r - 1
  if (dir === "S") nr = r + 1
  if (dir === "E") nc = c + 1
  if (dir === "W") nc = c - 1
  if (nr < 0 || nr > 5 || nc < 0 || nc > 5) { console.warn("[MOVE] out of bounds to", nr, nc); return null }
  const nextTid = board[nr][nc]
  if (nextTid === -1) { console.warn("[MOVE] next tile empty at", nr, nc); return null }
  const nextMeta = tilesMeta[String(nextTid)]
  if (!nextMeta?.branches?.includes(opp(dir))) { console.warn("[MOVE] next tile missing opp", opp(dir), "at", nr, nc, "meta:", nextMeta); return null }
  if (isOccupiedByOther(nr, nc, explorers, color)) { console.warn("[MOVE] occupied by other at", nr, nc); return null }
  return { nr, nc, nextTid }
}

// Check if can enter from edge
export const canEnterFromEdge = (ex: any, board: number[][], tilesMeta: Record<string, { branches: Branch[] }>, explorers: Record<ExplorerColor, any>) => {
  if (!ex.onEdge) return false
  const { side, index } = ex.onEdge
  if (side === "W") {
    const t = board[index][0]
    if (t === -1) return false
    if (!(tilesMeta as any)[String(t)]?.branches?.includes("W")) return false
    return !isOccupiedByOther(index, 0, explorers)
  }
  if (side === "S") {
    const t = board[5][index]
    if (t === -1) return false
    if (!(tilesMeta as any)[String(t)]?.branches?.includes("S")) return false
    return !isOccupiedByOther(5, index, explorers)
  }
  if (side === "E") {
    const t = board[index][5]
    if (t === -1) return false
    if (!(tilesMeta as any)[String(t)]?.branches?.includes("E")) return false
    return !isOccupiedByOther(index, 5, explorers)
  }
  const t = board[0][index]
  if (t === -1) return false
  if (!(tilesMeta as any)[String(t)]?.branches?.includes("N")) return false
  return !isOccupiedByOther(0, index, explorers)
}

// Calculate reward and update claimed
export const calculateReward = (
  tileId: number,
  color: ExplorerColor,
  rewards: Record<number, ("gold" | "crystal")[]> | undefined,
  claimedRewards: Record<ExplorerColor, Record<number, boolean>> | undefined
) => {
  // Ensure claimedRewards is always a valid object
  const safeClaimedRewards = claimedRewards || { red: {}, blue: {}, brown: {}, yellow: {} }
  const alreadyClaimed = !!(safeClaimedRewards[color]?.[tileId])
  const gain = alreadyClaimed ? 0 : rewardGain(tileId, rewards || {})
  const kinds = rewardKind(tileId, rewards || {})
  const addGold = !alreadyClaimed ? kinds.filter(k => k === "gold").length : 0
  const addCrystal = !alreadyClaimed ? kinds.filter(k => k === "crystal").length : 0
  const nextClaimed = !alreadyClaimed && kinds.length > 0
    ? {
        red: safeClaimedRewards.red || {},
        blue: safeClaimedRewards.blue || {},
        brown: safeClaimedRewards.brown || {},
        yellow: safeClaimedRewards.yellow || {},
        [color]: {
          ...(safeClaimedRewards[color] || {}),
          [tileId]: true,
        },
      }
    : safeClaimedRewards
  return { gain, addGold, addCrystal, nextClaimed }
}

// Ghost animation helper
export const setGhostStagesAndCommit = async (
  color: ExplorerColor,
  from8: { r: number; c: number },
  to8: { r: number; c: number },
  animGhostSetter: (ghost: any) => void,
  afterCommit: () => Promise<void>
) => {
  animGhostSetter({ color, from8, to8, stage: 0 }); await new Promise((r) => setTimeout(r, 100))
  animGhostSetter({ color, from8, to8, stage: 1 }); await new Promise((r) => setTimeout(r, 200))
  animGhostSetter({ color, from8, to8, stage: 2 }); await new Promise((r) => setTimeout(r, 200))
  animGhostSetter({ color, from8, to8, stage: 3 }); await new Promise((r) => setTimeout(r, 200))
  animGhostSetter({ color, from8, to8, stage: 4 }); await new Promise((r) => setTimeout(r, 50))
  animGhostSetter({ color, from8, to8, stage: 5 }); await new Promise((r) => setTimeout(r, 100))
  await afterCommit()
  animGhostSetter(null)
}

// Undo/Redo state snapshot
export type MoveState = {
  explorers: Record<ExplorerColor, any>
  score: number
  moves: number
  claimedRewards: Record<ExplorerColor, Record<number, boolean>>
  goldCount: number
  crystalCount: number
}

export const createMoveState = (me: Player): MoveState => ({
  explorers: { ...me.explorers },
  score: me.score,
  moves: me.moves,
  claimedRewards: me.claimedRewards || { red: {}, blue: {}, brown: {}, yellow: {} },
  goldCount: (me as any).goldCount || 0,
  crystalCount: (me as any).crystalCount || 0,
})

// Enter temple logic
export const enterTemple = async (
  color: ExplorerColor,
  side: Branch,
  index: number,
  game: Game,
  me: Player,
  playerId: string,
  players: Record<string, Player>,
  gameId: string,
  db: any,
  maybeAutoFinishMe: (newExplorers: any) => Promise<void>,
  endGame: (gameId: string, players: Record<string, Player>, db: any) => Promise<void>
) => {
  if (me.moves <= 0) return
  if (!["N", "E"].includes(side)) return

  // Check temple color match
  const temple = game.layout?.temples?.find((t) => t.side === side && t.index === index)
  if (!temple || temple.color !== color) return

  const tilesMeta = ((game as any).tilesMeta || {}) as Record<string, { branches: Branch[] }>
  const ex = me.explorers[color]
  if (!ex?.onBoard) return
  const { r, c, entry } = ex.onBoard
  const tid = me.board[r][c]
  if (tid === -1) return
  const meta = tilesMeta[String(tid)]
  const neededDir: Branch = side === "N" ? "N" : "E"
  if (!meta?.branches?.includes(neededDir)) { console.warn("[TEMPLE] current tile missing", neededDir, "meta:", meta); return }

  const wins = (game.templeWins || []) as any[]
  const sameColorWins = wins.filter((w) => w.color === color).length
  const orderReach = sameColorWins + 1
  const nPlayers = game.playersCount || Object.keys(players || {}).length || 1
  const gain = Math.max(0, nPlayers + 2 - orderReach)

  const newWins = [...wins, { side, index, color, playerId, order: orderReach }]
  const newExplorers = { ...me.explorers }
  delete newExplorers[color]

  await update(ref(db, `games/karuba/${gameId}`), {
    templeWins: newWins,
    lastEvent: `${players[playerId]?.name || "Player"} reached the ${color} temple and got ${gain} points!`,
  })
  await update(ref(db, `games/karuba/${gameId}/players/${playerId}`), {
    moves: me.moves - 1,
    explorers: newExplorers,
    score: me.score + gain,
  })

  await maybeAutoFinishMe(newExplorers)

  // Don't end game here - let it continue until round 36
  // const everyoneFinished = await computeEveryoneFinished(gameId, db)
  // if (everyoneFinished) {
  //   await endGame(gameId, players, db)
  // }
}
