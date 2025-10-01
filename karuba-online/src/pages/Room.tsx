import { useEffect, useMemo, useState } from "react"
import { db, ref, onValue, update, get } from "../firebase"
import { getPlayerId } from "../lib/playerId"
import Board from "../components/Board"
import Controls from "../components/Controls"
import type { Game, Player, Branch, ExplorerColor } from "../lib/types"
import { generateTilesMeta } from "../lib/deck"

const opp = (b: Branch): Branch => (b === "N" ? "S" : b === "S" ? "N" : b === "E" ? "W" : "E")

function TileIcon({
  id,
  tilesMeta,
  size = 40,
  reward,
}: {
  id: number
  tilesMeta: Record<string, { image?: number }>
  size?: number
  reward?: "gold" | "crystal" | null
}) {
  const img = (tilesMeta as any)?.[String(id)]?.image ?? id
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <img
        src={`/tiles/${img}.webp`}
        alt={`Tile ${id}`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
      />
      {reward === "gold" && (
        <img
          src="/tiles/gold.webp"
          alt="Gold"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
        />
      )}
      {reward === "crystal" && (
        <img
          src="/tiles/crystal.webp"
          alt="Crystal"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
        />
      )}
    </div>
  )
}

export default function Room({ gameId }: { gameId: string }) {
  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Record<string, Player>>({})
  const [error, setError] = useState<string | null>(null)
  const [showDiscardList, setShowDiscardList] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const [animGhost, setAnimGhost] = useState<{
    color: ExplorerColor
    from8: { r: number; c: number }
    to8: { r: number; c: number }
    stage: 0 | 1 | 2 | 3 | 4 | 5
  } | null>(null)

  const [previewAt, setPreviewAt] = useState<{ r: number; c: number } | null>(null)

  const playerName = (history.state as any)?.playerName || "Unknown"
  const playerId = getPlayerId(playerName)

  useEffect(() => {
    const off1 = onValue(ref(db, `games/karuba/${gameId}`), (s) => setGame(s.val()))
    const off2 = onValue(ref(db, `games/karuba/${gameId}/players`), (s) => setPlayers(s.val() || {}))
    return () => { off1(); off2() }
  }, [gameId])

  useEffect(() => {
    const boot = async () => {
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
    }
    boot().catch(() => {})
  }, [db, gameId])

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

  // Memoized data derived from players/game
  const me: Player | undefined = players[playerId]
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
  // const me: Player | undefined = players[playerId]
  // const order: string[] = useMemo(
  //   () => Object.values(players).sort((a, b) => a.joinedAt - b.joinedAt).map((p) => p.id),
  //   [players]
  // )

  // const canPlace = !!game && !!me && game.status === "playing" && game.currentTile > 0 && !me.actedForRound

  // useEffect(() => {
  //   if (!canPlace) setPreviewAt(null)
  //   if (canPlace && previewAt && me?.board?.[previewAt.r]?.[previewAt.c] !== -1) setPreviewAt(null)
  // }, [canPlace, me?.board, previewAt])

  const isHost = !!game && game.shuffleTurnUid === playerId
  const isGenerateTurnOwner = !!game && game.generateTurnUid === playerId

  const canGenerate =
    !!game &&
    (game.status === "waiting"
      ? isHost
      : game.status === "playing" && game.round >= 2 && isGenerateTurnOwner && game.currentTile === 0 && !isFinished)

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

  const rewardGain = (tileId: number | null | undefined) => {
    if (!tileId || !game?.rewards) return 0
    const r = game.rewards[tileId]
    if (r === "gold") return 2
    if (r === "crystal") return 1
    return 0
  }
  const rewardKind = (tileId: number | null | undefined) =>
    tileId && game?.rewards ? game.rewards[tileId] : null

  const isOccupiedByOther = (r: number, c: number, exceptColor?: ExplorerColor) => {
    if (!me) return false
    return Object.values(me.explorers || {}).some(
      (ex) => ex.onBoard && ex.onBoard.r === r && ex.onBoard.c === c && ex.color !== exceptColor
    )
  }

  // === End conditions helper ===
  const computeEveryoneFinished = async (): Promise<boolean> => {
    const plist = await get(ref(db, `games/karuba/${gameId}/players`))
    const pObj: Record<string, Player> = (plist.val() || {}) as any
    return Object.values(pObj || {}).every((p) => Object.keys(p.explorers || {}).length === 0)
  }
  const endGame = async () => {
    await update(ref(db, `games/karuba/${gameId}`), { status: "ended", statusText: "Game ended" })
  }

  // === Start / Generate ===
  const onStartOrGenerate = async () => {
    try {
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
          generateTurnUid: pids[idxForRound2] || playerId,
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
    } catch (e: any) {
      setError(e.message)
    }
  }

  // === Place / Discard / Ready ===
  const placeTile = async (r: number, c: number) => {
    try {
      if (!game || !me) return
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
      setPreviewAt(null)
    } catch (e: any) {
      setError("Place tile error: " + e.message)
    }
  }

  const discardTile = async (tileId: number, branches: Branch[]) => {
    try {
      if (!game || !me) return
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
      setPreviewAt(null)
    } catch (e: any) {
      setError("Discard error: " + e.message)
    }
  }

  const onReadyNextRound = async () => {
    try {
      if (!game || !me) return
      if (!me.actedForRound || me.doneForRound) return
      await update(ref(db, `games/karuba/${gameId}/players/${playerId}`), { doneForRound: true })
      await maybeAdvanceRound()
    } catch (e: any) {
      setError("Ready error: " + e.message)
    }
  }

  const maybeAdvanceRound = async () => {
    if (!game) return
    const plist = await get(ref(db, `games/karuba/${gameId}/players`))
    const pObj: Record<string, Player> = (plist.val() || {}) as any
    const allReady = Object.values(pObj || {}).every((p) => p.doneForRound)
    if (!allReady) return

    const pids = order
    const nextRound = game.round + 1

    // End if: hanya jika round habis > 36
    if (nextRound > 36) {
      await endGame()
      return
    }

    let nextIdx = game.generateTurnIndex
    if (nextRound !== 2) nextIdx = (game.generateTurnIndex + 1) % pids.length

    await update(ref(db, `games/karuba/${gameId}`), {
      round: nextRound,
      currentTile: 0,
      generateTurnIndex: nextIdx,
      generateTurnUid: pids[nextIdx] || pids[0],
      statusText: `Round ${nextRound} (waiting generate)`,
    })
    for (const pid of pids) {
      await update(ref(db, `games/karuba/${gameId}/players/${pid}`), {
        actedForRound: false,
        doneForRound: false,
        lastAction: null,
      })
    }
  }

  const maybeAutoFinishMe = async (newExplorers: any) => {
    try {
      if (!game || !me) return
      if (game.status !== "playing") return
      const noneLeft = !newExplorers || Object.keys(newExplorers).length === 0
      if (!noneLeft) return
      const pRef = ref(db, `games/karuba/${gameId}/players/${playerId}`)
      const updates: any = {}
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
      if (!game || !me) return
      if (me.moves <= 0) return
      const ex = me.explorers[color]
      if (!ex) return
      const tilesMeta = (game.tilesMeta || {}) as Record<string, { branches: Branch[] }>

      // const validateInternalMove = (r: number, c: number, entry: Branch, d: Branch) => {
      const validateInternalMove = (r: number, c: number, entry: Branch, d: Branch) => {
        const tid = me.board[r][c]
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
        const nextTid = me.board[nr][nc]
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
        setAnimGhost({ color, from8, to8, stage: 0 }); await new Promise((r) => setTimeout(r, 100))
        setAnimGhost({ color, from8, to8, stage: 1 }); await new Promise((r) => setTimeout(r, 200))
        setAnimGhost({ color, from8, to8, stage: 2 }); await new Promise((r) => setTimeout(r, 200))
        setAnimGhost({ color, from8, to8, stage: 3 }); await new Promise((r) => setTimeout(r, 200))
        setAnimGhost({ color, from8, to8, stage: 4 }); await new Promise((r) => setTimeout(r, 50))
        setAnimGhost({ color, from8, to8, stage: 5 }); await new Promise((r) => setTimeout(r, 100))
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

        const tid = me.board[r][c]
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
        const gain = rewardGain(tid)
        const kind = rewardKind(tid)

        await setGhostStagesAndCommit(from8, to8, async () => {
          const addGold = kind === "gold" ? 1 : 0
          const addCrystal = kind === "crystal" ? 1 : 0
          await update(ref(db, `games/karuba/${gameId}/players/${playerId}`), {
            moves: me.moves - 1,
            score: me.score + gain,
            goldCount: (me as any).goldCount ? (me as any).goldCount + addGold : addGold,
            crystalCount: (me as any).crystalCount ? (me as any).crystalCount + addCrystal : addCrystal,
            explorers: { ...me.explorers, [color]: { color, onBoard: { r, c, entry: side } } },
          })
        })
        return
      }

      // inside board
      if (ex.onBoard) {
        const { r, c, entry } = ex.onBoard
        const res = validateInternalMove(r, c, entry, dir)
        if (!res) return
        const { nr, nc, nextTid } = res

        const from8 = { r: r + 1, c: c + 1 }
        const to8 = { r: nr + 1, c: nc + 1 }
        const gain = rewardGain(nextTid)
        const kind = rewardKind(nextTid)

        await setGhostStagesAndCommit(from8, to8, async () => {
          const nextOnBoard = { r: nr, c: nc, entry: opp(dir) }
          const addGold = kind === "gold" ? 1 : 0
          const addCrystal = kind === "crystal" ? 1 : 0
          await update(ref(db, `games/karuba/${gameId}/players/${playerId}`), {
            moves: me.moves - 1,
            score: me.score + gain,
            goldCount: (me as any).goldCount ? (me as any).goldCount + addGold : addGold,
            crystalCount: (me as any).crystalCount ? (me as any).crystalCount + addCrystal : addCrystal,
            explorers: { ...me.explorers, [color]: { color, onBoard: nextOnBoard } },
          })
        })
      }
    } catch (e: any) {
      setError("Explorer step error: " + e.message)
    }
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

      // cek end juga di sini:
      const everyoneFinished = await computeEveryoneFinished()
      // kalau semua selesai → end
      if (everyoneFinished) {
        await endGame()
        return
      }
      // kalau sudah round 36 dan semua pemain "doneForRound" di ronde ini → end saat advance (ditangani maybeAdvanceRound)
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
      discardTile(game.currentTile, branches)
    }
  }

  // === Result stats ===
  // const allPlayers = useMemo(
  //   () => Object.values(players).sort((a, b) => b.score - a.score),
  //   [players]
  // )
  // const myRank = Math.max(1, allPlayers.findIndex((p) => p.id === playerId) + 1)
  // const nPlayers = allPlayers.length
  // const title =
  //   game.status !== "ended"
  //     ? "Game"
  //     : myRank === 1
  //     ? "Victory!"
  //     : myRank === nPlayers
  //     ? "Game Over!"
  //     : "Game Result"
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

  return (
    <main className="page">
      <div className="page-inner">
        <div className="card">
          <h2 style={{ margin: "4px 0" }} className="font-display">Karuba Online</h2>
          <p style={{ margin: "4px 0" }}>Game ID: {gameId}</p>
          <p style={{ margin: 0 }}>
            Status: {game.statusText} | Round: {game.round} | Current Tile:{" "}
            {me.actedForRound
              ? me.lastAction === "placed"
                ? "Placed!"
                : me.lastAction === "discarded"
                ? "Discarded!"
                : "—"
              : game.currentTile || "—"}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          <div className="card">
            <Controls
              isHost={isHost}
              status={game.status}
              round={game.round}
              canGenerate={!!canGenerate}
              onStartOrGenerate={onStartOrGenerate}
              onReady={onReadyNextRound}
              readyDisabled={!me.actedForRound || me.doneForRound || isFinished}
              waitingLabel={(() => {
                if (game.status === "waiting") return "Waiting host to start the game"
                if (game.status === "playing" && game.currentTile === 0 && game.round >= 2) {
                  return game.generateTurnUid === playerId
                    ? "You can generate now"
                    : `Waiting for ${players[game.generateTurnUid!]?.name || "player"} to generate tile`
                }
                return `Round ${game.round}`
              })()}
            />

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
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
              <img
                src="/trash.svg"
                alt="Trash"
                title={game.currentTile > 0 && canPlace ? "Discard tile" : "No tile to discard"}
                onClick={handleTrash}
                style={{
                  width: 28,
                  height: 28,
                  cursor: game.currentTile > 0 && canPlace ? "pointer" : "default",
                  opacity: game.currentTile > 0 && canPlace ? 1 : 0.5,
                }}
              />
              <button onClick={() => setShowDiscardList(true)} style={{ marginLeft: 4 }}>
                Discarded Tiles
              </button>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }} className="font-display">Players</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {Object.values(players || {})
                .sort((a, b) => a.joinedAt - b.joinedAt)
                .map((p) => {
                  const isTurn = game.generateTurnUid === p.id && game.round >= 2 && game.currentTile === 0
                  const isPlayerFinished = !p.explorers || Object.keys(p.explorers).length === 0
                  const state = isPlayerFinished ? "finished" : p.doneForRound ? "ready ✓" : p.actedForRound ? "placed tile" : "playing"
                  return (
                    <li key={p.id} style={{ marginBottom: 4, fontWeight: isTurn ? 700 : 400 }}>
                      {p.name} — Score: {p.score} ({state})
                    </li>
                  )
                })}
            </ul>
            {game.lastEvent && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed rgba(0,0,0,0.15)" }}>
                <em>{game.lastEvent}</em>
              </div>
            )}
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
              onPlace={placeTile}
              previewTileId={canPlace ? game.currentTile : null}
              previewAt={previewAt}
              onPreview={(r, c) => setPreviewAt({ r, c })}
              myMoves={me.moves}
              myExplorers={me.explorers}
              temples={game.layout?.temples || []}
              templeWins={game.templeWins || []}
              onMoveOne={async (color, dir) => { await moveOne(color, dir) }}
              onEnterTemple={enterTemple}
              animGhost={animGhost}
              isFinished={isFinished}
            />
          </div>
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

        {/* Result Modal */}
        {showResult && (
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
                padding: 20,
                borderRadius: 12,
                width: 420,
                boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
              }}
            >
              <h2 className="font-display" style={{ marginTop: 0, marginBottom: 4 }}>
                {(() => {
                  const myPos = Math.max(1, Object.values(players || {}).sort((a,b)=>b.score-a.score).findIndex(p=>p.id===playerId)+1)
                  if (myPos === 1) return "Victory!"
                  if (myPos === Object.keys(players || {}).length) return "Game Over!"
                  return "Game Result"
                })()}
              </h2>

              <div style={{ marginBottom: 10 }}>
                <strong>Total Points (Rank):</strong><br/>
                {(() => {
                  const sorted = Object.values(players || {}).sort((a,b)=>b.score-a.score)
                  const rank = Math.max(1, sorted.findIndex(p=>p.id===playerId)+1)
                  return `${players[playerId].score} (#${rank})`
                })()}
              </div>

              <div style={{ marginBottom: 10 }}>
                <strong>Total Temple Finishing order:</strong>
                <ul style={{ margin: "6px 0 0", paddingLeft: 16 }}>
                  {(() => {
                    const sorted = Object.values(players || {}).sort((a,b)=>b.score-a.score)
                    const n = sorted.length
                    const wins = (game.templeWins || []) as any[]
                    const mine = wins.filter(w => w.playerId === playerId)
                    const perOrder: Record<number, number> = {}
                    for (const w of mine) perOrder[w.order] = (perOrder[w.order]||0)+1
                    return Array.from({length:n}, (_,i)=>i+1).map(o=>(
                      <li key={o}>{o===1?"1st":o===2?"2nd":o===3?"3rd":`${o}th`}: {perOrder[o]||0}</li>
                    ))
                  })()}
                </ul>
              </div>

              <div style={{ marginBottom: 12 }}>
                <strong>Total Coins:</strong><br/>
                {(players[playerId] as any).goldCount || 0} Gold & {(players[playerId] as any).crystalCount || 0} Crystal
              </div>

              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => {
                    setShowResult(false)
                    history.pushState({}, "", "/")
                    dispatchEvent(new PopStateEvent("popstate"))
                  }}
                >
                  Back to Lobby
                </button>
              </div>
            </div>
          </div>
        )}

        {error && <div style={{ color: "red" }}>{error}</div>}
      </div>
    </main>
  )
}
