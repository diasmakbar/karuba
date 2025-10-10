import { useEffect, useMemo, useState, useRef } from "react"
import { db, ref, onValue, update, get } from "../firebase"
import { getPlayerId } from "../lib/playerId"
import Board from "../components/Board"
import Controls from "../components/Controls"
import ResultModal from "../components/ResultModal"
import type { Game, Player, Branch, ExplorerColor } from "../lib/types"
import {
  opp,
  rewardGain,
  rewardKind,
  isOccupiedByOther,
  computeEveryoneFinished,
  endGame,
  onStartOrGenerate,
  playerNameById,
  waitingLabel,
  canGenerate,
  placeTile,
  discardTile,
  onReadyNextRound,
  maybeAdvanceRound,
  validateInternalMove,
  canEnterFromEdge,
  calculateReward,
  setGhostStagesAndCommit,
  createMoveState,
  enterTemple,
} from "../utils/room"

function TileIcon({
  id,
  tilesMeta,
  size = 40,
  reward,
}: {
  id: number
  tilesMeta: Record<string, { image?: number }>
  size?: number
  reward?: ("gold" | "crystal")[] | "gold" | "crystal" | null
}) {
  const img = (tilesMeta as any)?.[String(id)]?.image ?? id

  // Handle both old format (single value) and new format (array)
  const rewardsArray: ("gold" | "crystal")[] = Array.isArray(reward)
    ? reward
    : reward ? [reward] : []

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <img
        src={`/tiles/${img}.webp`}
        alt={`Tile ${id}`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
      />
      {rewardsArray.map((r, index) => (
        <img
          key={r + index}
          src={`/tiles/${r}.webp`}
          alt={r === "gold" ? "Gold" : "Crystal"}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transform: rewardsArray.length > 1 ? `translate(${index * 2}px, ${index * 2}px)` : undefined,
          }}
        />
      ))}
    </div>
  )
}

export default function Room({ gameId }: { gameId: string }) {
  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Record<string, Player>>({})
  const [error, setError] = useState<string | null>(null)
  const [showDiscardList, setShowDiscardList] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null)
  
  const [animGhost, setAnimGhost] = useState<{
    color: ExplorerColor
    from8: { r: number; c: number }
    to8: { r: number; c: number }
    stage: 0 | 1 | 2 | 3 | 4 | 5
  } | null>(null)

  const [previewAt, setPreviewAt] = useState<{ r: number; c: number } | null>(null)
  const [showIdleModal, setShowIdleModal] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastActionRef = useRef<number>(Date.now())
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null)

  const playerName = (history.state as any)?.playerName || "Unknown"
  const playerId = getPlayerId(playerName)

  // Memoized data derived from players/game - moved up before useEffect hooks
  const me: Player | undefined = players[playerId]

  // Auto-ready when actedForRound and moves === 0
  useEffect(() => {
    if (me?.actedForRound && me.moves === 0 && !me.doneForRound && game?.status === "playing") {
      onReadyNextRound(game, me, playerId, gameId, players, db)
    }
  }, [me?.actedForRound, me?.moves, me?.doneForRound, game?.status])

  // Idle popup after 5 seconds
  useEffect(() => {
    if (!me || !game || game.status !== "playing") return

    // Start idle timer when player has acted but not ready
    if (me.actedForRound && !me.doneForRound) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      idleTimerRef.current = setTimeout(() => {
        setShowIdleModal(true)
      }, 5000) // 5 seconds
    } else {
      // Clear timer when not applicable
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }
      setShowIdleModal(false)
    }

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
    }
  }, [me?.actedForRound, me?.doneForRound, game?.status])

  // Reset idle timer on any action
  const resetIdleTimer = () => {
    lastActionRef.current = Date.now()
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
    setShowIdleModal(false)
  }

  // Show toast for game events
  useEffect(() => {
    if (game?.lastEvent) {
      setToastMessage(game.lastEvent)
      // Auto-hide toast after 4 seconds
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      toastTimerRef.current = setTimeout(() => {
        setToastMessage(null)
      }, 4000)
    }
  }, [game?.lastEvent])

  useEffect(() => {
    const off1 = onValue(ref(db, `games/karuba/${gameId}`), (s) => setGame(s.val()))
    const off2 = onValue(ref(db, `games/karuba/${gameId}/players`), (s) => setPlayers(s.val() || {}))
    return () => { off1(); off2() }
  }, [gameId])

  useEffect(() => {
    const boot = async () => {
      try {
        const gRef = ref(db, `games/karuba/${gameId}`)
        const snap = await get(gRef)
        const g = snap.val()
        if (!g) return
        if (g.round == null || g.currentTile == null || g.status == null) {
          await update(gRef, {
            round: 0,
            currentTile: 0,
            status: "waiting",
            statusText: "Waiting host to start the game",
          })
        }
        const plist = await get(ref(db, `games/karuba/${gameId}/players`))
        const pObj = plist.val() || {}
        await update(gRef, { playersCount: Object.keys(pObj).length })
      } catch (error) {
        console.error('Boot error:', error)
      }
    }
    boot()
  }, [gameId])

  useEffect(() => {
    if (game?.status === "ended") setShowResult(true)
  }, [game?.status])

  // Skip generateTurnUid to unfinished player
  useEffect(() => {
    if (!game || !players) return
    const currentGen = game.generateTurnUid
    if (currentGen && players[currentGen]) {
      const isFinished = !players[currentGen].explorers || Object.keys(players[currentGen].explorers || {}).length === 0
      if (isFinished) {
        const order = Object.values(players || {}).sort((a, b) => a.joinedAt - b.joinedAt).map(p => p.id)
        const currentIdx = order.indexOf(currentGen)
        let nextIdx = (currentIdx + 1) % order.length
        while (nextIdx !== currentIdx) {
          const nextId = order[nextIdx]
          const nextPlayer = players[nextId]
          const nextFinished = !nextPlayer?.explorers || Object.keys(nextPlayer.explorers || {}).length === 0
          if (!nextFinished) {
            update(ref(db, `games/karuba/${gameId}`), { generateTurnUid: nextId })
            break
          }
          nextIdx = (nextIdx + 1) % order.length
        }
      }
    }
  }, [game?.generateTurnUid, players])
  const isFinished = !me?.explorers || Object.keys(me.explorers).length === 0
  const order: string[] = useMemo(() => {
    return Object.values(players || {})
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map((p) => p.id)
  }, [players])
   const allPlayers = useMemo(() => {
    return Object.values(players || {}).sort((a, b) => b.score - a.score)
  }, [players])
   const canPlace =
    !!game && !!me && game.status === "playing" && game.currentTile > 0 && !me.actedForRound && !isFinished
   useEffect(() => {
    if (!canPlace) {
      setPreviewAt(null)
      return
    }
    if (previewAt && me?.board?.[previewAt.r]?.[previewAt.c] !== -1) {
      setPreviewAt(null)
    }
  }, [canPlace, me?.board, previewAt])

  const isHost = !!game && game.shuffleTurnUid === playerId
  const isGenerateTurnOwner = !!game && game.generateTurnUid === playerId

  const canGenerateValue = game && game.status === "playing" && game.round >= 2 && isGenerateTurnOwner && game.currentTile === 0

  const playerNameById = (pid: string) => players[pid]?.name || "player"
  const waitingLabel =
    !game
      ? "Loading..."
      : game.status === "waiting"
      ? "Waiting host to start the game"
      : game.round === 1
      ? "Place or discard your tile, then move explorers if any"
      : isGenerateTurnOwner
      ? "You can generate now"
      : `Waiting for ${playerNameById(game.generateTurnUid!)} to generate tile`

  const isOccupiedByOther = (r: number, c: number, exceptColor?: ExplorerColor) => {
    if (!me) return false
    return Object.values(me.explorers || {}).some(
      (ex) => ex.onBoard && ex.onBoard.r === r && ex.onBoard.c === c && ex.color !== exceptColor
    )
  }

  const maybeAutoFinishMe = async (newExplorers: any) => {
    try {
      if (!game || !me) return
      if (game.status !== "playing") return
      const noneLeft = !newExplorers || Object.keys(newExplorers).length === 0
      if (!noneLeft) return
      const pRef = ref(db, `games/karuba/${gameId}/players/${playerId}`)
      const updates: any = {}
      if (me.finishedAtRound == null) {
        updates.finishedAtRound = game.round
      }
      if (game.currentTile > 0 && !me.actedForRound) {
        // Auto discard tile
        const branches = ((game.tilesMeta || {}) as any)[String(game.currentTile)]?.branches || []
        updates.moves = (me.moves || 0) + branches.length
        updates.lastDiscardDirs = branches
        updates.actedForRound = true
        updates.lastAction = "auto"
        updates.discardedTiles = [...(me.discardedTiles || []), game.currentTile]
        updates.usedTiles = { ...(me.usedTiles || {}), [game.currentTile]: true }
      }
      if (Object.keys(updates).length > 0) {
        await update(pRef, updates)
      }
    } catch {}
  }

  // === Move 1 grid ===
  const moveOne = async (color: ExplorerColor, dir: Branch) => {
    try {
      // Reset idle timer when explorer moves
      resetIdleTimer()

      if (!game || !me) return

      // Get fresh player data from Firebase to ensure we have latest moves count
      const { db, ref, get } = await import('../firebase')
      const playerSnap = await get(ref(db, `games/karuba/${gameId}/players/${playerId}`))
      const currentMe = playerSnap.val()

      if (currentMe.moves <= 0) {
        console.log("No moves remaining, current moves:", currentMe.moves)
        return
      }

      const ex = currentMe.explorers[color]
      if (!ex) {
        console.log("Explorer not found:", color)
        return
      }
      const tilesMeta = (game.tilesMeta || {}) as Record<string, { branches: Branch[] }>

      // Save current state to history before move
      const currentState = {
        explorers: { ...currentMe.explorers },
        score: currentMe.score,
        moves: currentMe.moves,
        claimedRewards: currentMe.claimedRewards || { red: {}, blue: {}, brown: {}, yellow: {} },
        goldCount: (currentMe as any).goldCount || 0,
        crystalCount: (currentMe as any).crystalCount || 0,
      }
      const newMovesHistory = [...(currentMe.movesHistory || []), currentState]
      const newRedoHistory: typeof newMovesHistory = []

      await update(ref(db, `games/karuba/${gameId}/players/${playerId}`), {
        movesHistory: newMovesHistory,
        redoHistory: newRedoHistory,
      })

      // const validateInternalMove = (r: number, c: number, entry: Branch, d: Branch) => {
      const validateInternalMove = (r: number, c: number, entry: Branch, d: Branch) => {
        const tid = currentMe.board[r][c]
        // if (tid === -1) return null
        if (tid === -1) { console.warn("[MOVE] no tile at", r, c); return null }
        const meta = tilesMeta[String(tid)]
        // if (!meta?.branches?.includes(d) || d === entry) return null
        // Backtrack: hapus larangan d === entry
        if (!meta?.branches?.includes(d)) { console.warn("[MOVE] current tile has no branch", d, "at", r, c, "meta:", meta); return null }

        let nr = r, nc = c
        if (d === "N") nr = r - 1
        if (d === "S") nr = r + 1
        if (d === "E") nc = c + 1
        if (d === "W") nc = c - 1
        // if (nr < 0 || nr > 5 || nc < 0 || nc > 5) return null
        if (nr < 0 || nr > 5 || nc < 0 || nc > 5) { console.warn("[MOVE] out of bounds to", nr, nc); return null }
        const nextTid = currentMe.board[nr][nc]
        // if (nextTid === -1) return null
        if (nextTid === -1) { console.warn("[MOVE] next tile empty at", nr, nc); return null }
        const nextMeta = tilesMeta[String(nextTid)]
        // if (!nextMeta?.branches?.includes(opp(d))) return null
        // if (isOccupiedByOther(nr, nc, color)) return null
        if (!nextMeta?.branches?.includes(opp(d))) { console.warn("[MOVE] next tile missing opp", opp(d), "at", nr, nc, "meta:", nextMeta); return null }
        if (isOccupiedByOther(nr, nc, color)) { console.warn("[MOVE] occupied by other at", nr, nc); return null }
        return { nr, nc, nextTid }
      }

      const setGhostStagesAndCommit = async (
        from8: { r: number; c: number },
        to8: { r: number; c: number },
        afterCommit: () => Promise<void>
      ) => {
        // Stage 0: Change to frame 2 (0.2s) - masih di tile asal
        setAnimGhost({ color, from8, to8, stage: 0 }); await new Promise((r) => setTimeout(r, 200))

        // Stage 1-12: Move with frame 2 (0.6s) - bergerak smooth ke tile target dengan 12 stages
        for (let i = 1; i <= 12; i++) {
          setAnimGhost({ color, from8, to8, stage: i }); await new Promise((r) => setTimeout(r, 50))
        }

        // Stage 13-14: Change to frame 1 (0.2s) - sampai di tile target
        setAnimGhost({ color, from8, to8, stage: 13 }); await new Promise((r) => setTimeout(r, 100))
        setAnimGhost({ color, from8, to8, stage: 14 }); await new Promise((r) => setTimeout(r, 100))

        await afterCommit()
        setAnimGhost(null)
      }

      // from edge
      if (ex.onEdge) {
        const { side, index } = ex.onEdge
        let r = -1, c = -1
        if (side === "W") { r = index; c = 0 }
        else if (side === "S") { r = 5; c = index }
        else if (side === "E") { r = index; c = 5 }
        else { r = 0; c = index }

        const tid = currentMe.board[r][c]
        if (tid === -1) return
        const meta = (game.tilesMeta || {})[String(tid)] as any
        if (!meta?.branches?.includes(side)) return
        if (isOccupiedByOther(r, c, color)) return

        const from8 =
          side === "W" ? { r: r + 1, c: 0 } :
          side === "S" ? { r: 7, c: c + 1 } :
          side === "E" ? { r: r + 1, c: 7 } :
                         { r: 0, c: c + 1 }
        const to8 = { r: r + 1, c: c + 1 }
        const { gain, addGold, addCrystal, nextClaimed } = calculateReward(tid, color, game.rewards || {}, currentMe.claimedRewards || { red: {}, blue: {}, brown: {}, yellow: {} })

        await setGhostStagesAndCommit(from8, to8, async () => {
          await update(ref(db, `games/karuba/${gameId}/players/${playerId}`), {
            moves: currentMe.moves - 1,
            score: currentMe.score + gain,
            goldCount: (currentMe as any).goldCount + addGold,
            crystalCount: (currentMe as any).crystalCount + addCrystal,
            claimedRewards: nextClaimed,
            explorers: { ...currentMe.explorers, [color]: { color, onBoard: { r, c, entry: side } } },
          })
        })
        return
      }

      // inside board
      if (ex.onBoard) {
        const { r, c, entry } = ex.onBoard
        const tid = currentMe.board[r][c]  // Get source tile ID
        const res = validateInternalMove(r, c, entry, dir)
        if (!res) return
        const { nr, nc, nextTid } = res

        const from8 = { r: r + 1, c: c + 1 }
        const to8 = { r: nr + 1, c: nc + 1 }

        // Calculate rewards for both source and target tiles
        const { gain: targetGain, addGold: targetAddGold, addCrystal: targetAddCrystal, nextClaimed: targetClaimed } = calculateReward(nextTid, color, game.rewards || {}, currentMe.claimedRewards || { red: {}, blue: {}, brown: {}, yellow: {} })
        const { gain: sourceGain, addGold: sourceAddGold, addCrystal: sourceAddCrystal, nextClaimed: sourceClaimed } = calculateReward(tid, color, game.rewards || {}, targetClaimed)

        const totalGain = targetGain + sourceGain
        const totalAddGold = targetAddGold + sourceAddGold
        const totalAddCrystal = targetAddCrystal + sourceAddCrystal

        await setGhostStagesAndCommit(from8, to8, async () => {
          const nextOnBoard = { r: nr, c: nc, entry: opp(dir) }

          await update(ref(db, `games/karuba/${gameId}/players/${playerId}`), {
            moves: currentMe.moves - 1,
            score: currentMe.score + totalGain,
            goldCount: (currentMe as any).goldCount + totalAddGold,
            crystalCount: (currentMe as any).crystalCount + totalAddCrystal,
            claimedRewards: sourceClaimed,
            explorers: { ...currentMe.explorers, [color]: { color, onBoard: nextOnBoard } },
          })
        })
      }
    } catch (e: any) {
      setError("Explorer step error: " + e.message)
    }
  }

  // === Undo/Redo Moves ===
  const undoMove = async () => {
    if (!me || !me.movesHistory || me.movesHistory.length === 0) return
    const prevState = me.movesHistory[me.movesHistory.length - 1]
    const newMovesHistory = me.movesHistory.slice(0, -1)
    const newRedoHistory = [...(me.redoHistory || []), {
      explorers: { ...me.explorers },
      score: me.score,
      moves: me.moves,
      claimedRewards: me.claimedRewards || { red: {}, blue: {}, brown: {}, yellow: {} },
      goldCount: (me as any).goldCount || 0,
      crystalCount: (me as any).crystalCount || 0,
    }]
    await update(ref(db, `games/karuba/${gameId}/players/${playerId}`), {
      explorers: prevState.explorers,
      score: prevState.score,
      moves: prevState.moves,
      claimedRewards: prevState.claimedRewards || { red: {}, blue: {}, brown: {}, yellow: {} },
      goldCount: prevState.goldCount,
      crystalCount: prevState.crystalCount,
      movesHistory: newMovesHistory,
      redoHistory: newRedoHistory,
    })
  }

  const redoMove = async () => {
    if (!me || !me.redoHistory || me.redoHistory.length === 0) return
    const nextState = me.redoHistory[me.redoHistory.length - 1]
    const newRedoHistory = me.redoHistory.slice(0, -1)
    const newMovesHistory = [...(me.movesHistory || []), {
      explorers: { ...me.explorers },
      score: me.score,
      moves: me.moves,
      claimedRewards: me.claimedRewards || { red: {}, blue: {}, brown: {}, yellow: {} },
      goldCount: (me as any).goldCount || 0,
      crystalCount: (me as any).crystalCount || 0,
    }]
    await update(ref(db, `games/karuba/${gameId}/players/${playerId}`), {
      explorers: nextState.explorers,
      score: nextState.score,
      moves: nextState.moves,
      claimedRewards: nextState.claimedRewards || { red: {}, blue: {}, brown: {}, yellow: {} },
      goldCount: nextState.goldCount,
      crystalCount: nextState.crystalCount,
      movesHistory: newMovesHistory,
      redoHistory: newRedoHistory,
    })
  }

  // === Enter Temple ===
  const enterTemple = async (color: ExplorerColor, side: Branch, index: number) => {
    try {
      if (!game || !me) return
      if (me.moves <= 0) return
      if (!["N", "E"].includes(side)) return

      // Check temple color match
      const temple = game.layout?.temples?.find((t) => t.side === side && t.index === index)
      if (!temple || temple.color !== color) return

      const tilesMeta = (game.tilesMeta || {}) as Record<string, { branches: Branch[] }>
      const ex = me.explorers[color]
      if (!ex?.onBoard) return
      const { r, c, entry } = ex.onBoard
      const tid = me.board[r][c]
      if (tid === -1) return
      const meta = tilesMeta[String(tid)]
      const neededDir: Branch = side === "N" ? "N" : "E"
      // if (!meta?.branches?.includes(neededDir) || neededDir === entry) return
      if (!meta?.branches?.includes(neededDir)) { console.warn("[TEMPLE] current tile missing", neededDir, "meta:", meta); return }

      const wins = (game.templeWins || []) as any[]
      const sameColorWins = wins.filter((w) => w.color === color).length
      const orderReach = sameColorWins + 1
      // const nPlayers = game.playersCount || Object.keys(players).length || 1
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
      setAnimGhost(null)

      // auto-finish jika explorer saya habis
      await maybeAutoFinishMe(newExplorers)

      // Don't end game here - let it continue until round 36
      // const everyoneFinished = await computeEveryoneFinished(gameId, db)
      // if (everyoneFinished) {
      //   await endGame(gameId, players, db)
      //   return
      // }
      // kalau sudah round 36 dan semua pemain "doneForRound" di ronde ini - end saat advance (ditangani maybeAdvanceRound)
    } catch (e: any) {
      setError("Explorer step error: " + e.message)
    }
  }

  // EARLY
  if (error) return <div style={{ padding: 16, color: "red" }}>{error}</div>
  if (!game || !me) return <div style={{ padding: 16 }}>Loading game...</div>

  const handleTrash = () => {
    if (!canPlace || game.currentTile <= 0) return
    const branches = ((game.tilesMeta || {}) as any)[String(game.currentTile)]?.branches || []
    if (confirm(`Discard tile? Gain +${branches.length} moves.`)) {
      discardTile(game.currentTile, branches, game, me, playerId, gameId, db)
    }
  }

  const myRank = Math.max(1, allPlayers.findIndex((p) => p.id === playerId) + 1)
  const nPlayers = allPlayers.length
  const title =
    game.status !== "ended"
      ? "Game"
      : myRank === 1
      ? "Victory!"
      : myRank === nPlayers
      ? "Game Over!"
      : "Game Result"

  const winsArr = (game.templeWins || []) as any[]
  const myWins = winsArr.filter((w) => w.playerId === playerId)
  const orderCount: Record<number, number> = {}
  for (const w of myWins) orderCount[w.order] = (orderCount[w.order] || 0) + 1
  const orders = Array.from({ length: nPlayers }, (_, i) => i + 1)

  // Calculate unfinished explorers for current player
  const unfinishedExplorers = me ? Object.keys(me.explorers || {}).length : 0

  return (
    <main className="page">
      <div className="page-inner">
        {/* <div className="card">
          <h2 style={{ margin: "4px 0" }} className="font-display">Karuba Online</h2>
          <p style={{ margin: "4px 0" }}>Game ID: {gameId}.</p>
          <p style={{ margin: 0 }}>
            Status: {game.statusText} | Round: {game.round} | Current Tile:{" "}
            {me.actedForRound
              ? me.lastAction === "placed"
                ? "Placed!"
                : me.lastAction === "discarded"
                ? "Discarded!"
                : "-"
              : game.currentTile || "-"}
          </p>
        </div> */}

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          <div className="card" style={{ padding: 20 }}>
            <h2 style={{ margin: "4px 0" }} className="font-display">Karuba Online</h2> 

            <div style={{ margin: "12px 0" }}>
              <p style={{ margin: 0 }}>
                Game ID: {gameId} |{" "}
                {(() => {
                  if (game.status === "waiting") return "Waiting host to start the game"
                  if (game.status === "playing" && game.currentTile === 0 && game.round >= 2) {
                    return game.generateTurnUid === playerId
                      ? "You can generate now"
                      : `Waiting for ${players[game.generateTurnUid!]?.name || "player"} to generate tile`
                  }
                  return `Round ${game.round} of 36`
                })()}
              </p>
            </div>


            <Controls
              isHost={isHost}
              status={game.status}
              round={game.round}
              canGenerate={canGenerateValue}
              onStartOrGenerate={() => onStartOrGenerate(game, gameId, isHost, isGenerateTurnOwner, order, db)}
              onReady={() => onReadyNextRound(game, me, playerId, gameId, players, db)}
              onShowScoreboard={() => setShowResult(true)}
              readyDisabled={!me.actedForRound || me.doneForRound}
              waitingLabel={(() => {
                if (game.status === "waiting") return "Waiting host to start the game"
                if (game.status === "playing" && game.currentTile === 0 && game.round >= 2) {
                  return game.generateTurnUid === playerId
                    ? "You can generate now"
                    : `Waiting for ${players[game.generateTurnUid!]?.name || "player"} to generate tile`
                }
                return `Round ${game.round}`
              })()}
              playerMoves={me.moves}
              unfinishedExplorers={unfinishedExplorers}
            />

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
              <strong>Current Tile:</strong>
              {me.actedForRound ? (
                <span>{me.lastAction === "placed" ? "Placed!" : "Discarded!"}</span>
              ) : game.currentTile > 0 ? (
                <TileIcon
                  id={game.currentTile}
                  tilesMeta={(game.tilesMeta || {}) as any}
                  size={40}
                  reward={game.rewards?.[game.currentTile]}
                />
              ) : (
                <span>-</span>
              )}
              <span style={{ opacity: 0.5 }}>|</span>
              <span>Moves: {me.moves}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 }}>
              <img
                src="/trash.svg"
                alt="Trash"
                title={game.currentTile > 0 && canPlace ? "Discard tile" : "No tile to discard"}
                onClick={handleTrash}
                style={{
                  width: 30,
                  height: 30,
                  cursor: game.currentTile > 0 && canPlace ? "pointer" : "default",
                  opacity: game.currentTile > 0 && canPlace ? 1 : 0.5,
                }}
              />
              <img
                src="/discarded.svg"
                alt="Discarded Tiles"
                title="Discarded Tiles"
                onClick={() => setShowDiscardList(true)}
                style={{
                  width: 40,
                  height: 40,
                  cursor: "pointer",
                }}
              />
              <img
                src="/arrows/arrow_left.svg"
                alt="Undo Move"
                title="Undo Move"
                onClick={undoMove}
                style={{
                  width: 40,
                  height: 40,
                  cursor: (!me?.movesHistory || me.movesHistory.length === 0) ? "default" : "pointer",
                  opacity: (!me?.movesHistory || me.movesHistory.length === 0) ? 0.5 : 1,
                }}
              />
              <img
                src="/arrows/arrow_right.svg"
                alt="Redo Move"
                title="Redo Move"
                onClick={redoMove}
                style={{
                  width: 40,
                  height: 40,
                  cursor: (!me?.redoHistory || me.redoHistory.length === 0) ? "default" : "pointer",
                  opacity: (!me?.redoHistory || me.redoHistory.length === 0) ? 0.5 : 1,
                }}
              />
            </div>
          </div>
        </div>

        <div className="board-scroll">
          <div className="board-frame">
            <Board
              myPlayerId={playerId}
              board={me.board}
              tilesMeta={(game.tilesMeta || {}) as any}
              rewards={game.rewards || {}}
              canPlace={canPlace}
              onPlace={(r, c) => placeTile(r, c, game, me, playerId, gameId, db)}
              previewTileId={canPlace ? game.currentTile : null}
              previewAt={previewAt}
              onPreview={(r, c) => setPreviewAt({ r, c })}
              myMoves={me.moves}
              myExplorers={me.explorers}
              temples={game.layout?.temples || []}
              templeWins={game.templeWins || []}
              onMoveOne={moveOne}
              onEnterTemple={enterTemple}
              animGhost={animGhost}
              isFinished={isFinished}
            />
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0 }} className="font-display">Players</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {Object.values(players || {})
              .sort((a, b) => b.score - a.score)
              .map((p) => {
                const isTurn = game.generateTurnUid === p.id && game.round >= 2 && game.currentTile === 0
                const isPlayerFinished = !p.explorers || Object.keys(p.explorers).length === 0
                const state = isPlayerFinished ? "finished" : p.doneForRound ? "ready ✓" : p.actedForRound ? "placed tile" : "playing"
                return (
                  <li key={p.id} style={{ marginBottom: 4, fontWeight: isTurn ? 700 : 400 }}>
                    {p.name} - Score: {p.score} ({state})
                  </li>
                )
              })}
          </ul>
        </div>

        {showDiscardList && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setShowDiscardList(false)}
          >
            <div style={{ background: "#fff", padding: 16, borderRadius: 10, width: 360 }} onClick={(e) => e.stopPropagation()}>
              <h4 style={{ marginTop: 0 }} className="font-display">Discarded Tiles</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {me.discardedTiles?.length ? (
                  me.discardedTiles.map((tid, i) => (
                    <TileIcon
                      key={`${tid}-${i}`}
                      id={tid}
                      tilesMeta={(game.tilesMeta || {}) as any}
                      size={42}
                      reward={game.rewards?.[tid]}
                    />
                  ))
                ) : (
                  <div>No discarded tiles</div>
                )}
              </div>
              <div style={{ marginTop: 10, textAlign: "center" }}>
                <button onClick={() => setShowDiscardList(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        <ResultModal
          game={game}
          players={players}
          showResult={showResult}
          setShowResult={setShowResult}
        />

        {showIdleModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1200,
            }}
          >
            <div
              style={{
                background: "#fff",
                padding: 24,
                borderRadius: 12,
                width: 320,
                textAlign: "center",
                boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 16 }} className="font-display">
                Ready for next round?
              </h3>
              <p style={{ marginBottom: 20, color: "#666" }}>
                You've placed/discarded your tile but haven't clicked ready yet.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button
                  onClick={() => {
                    setShowIdleModal(false)
                    if (idleTimerRef.current) {
                      clearTimeout(idleTimerRef.current)
                      idleTimerRef.current = null
                    }
                  }}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid #ccc",
                    background: "#f5f5f5",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Not yet
                </button>
                <button
                  onClick={() => {
                    setShowIdleModal(false)
                    if (idleTimerRef.current) {
                      clearTimeout(idleTimerRef.current)
                      idleTimerRef.current = null
                    }
                    onReadyNextRound(game, me, playerId, gameId, players, db)
                  }}
                  style={{
                    padding: "8px 16px",
                    border: "none",
                    background: "#007bff",
                    color: "white",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Yes, ready!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div
            style={{
              position: "fixed",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#333",
              color: "white",
              padding: "12px 20px",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              zIndex: 1500,
              maxWidth: "400px",
              textAlign: "center",
              fontSize: "14px",
              lineHeight: "1.4",
              cursor: "pointer",
              animation: "slideDown 0.3s ease-out",
            }}
            onClick={() => {
              setToastMessage(null)
              if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current)
              }
            }}
          >
            {toastMessage}
            <div
              style={{
                position: "absolute",
                top: "4px",
                right: "8px",
                fontSize: "16px",
                lineHeight: "1",
                opacity: 0.7,
              }}
            >
              ×
            </div>
          </div>
        )}

        {error && <div style={{ color: "red" }}>{error}</div>}
      </div>
    </main>
  )
}
