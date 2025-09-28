import { useEffect, useMemo, useState } from "react"
import { db, ref, onValue, update, get } from "../firebase"
import { getPlayerId } from "../lib/playerId"
import Board from "../components/Board"
import Controls from "../components/Controls"
import type { Game, Player, Branch, ExplorerColor, TilesMetaMap, TempleWin } from "../lib/types"
import tilesMetaJson from "../lib/tiles.json"

const tilesMeta = tilesMetaJson as TilesMetaMap
const opp = (b: Branch): Branch => (b === "N" ? "S" : b === "S" ? "N" : b === "E" ? "W" : "E")
const ORDER_POINTS = [5, 3, 2, 1] // urutan tiba ke temple (sementara)

// Render kecil: tile + reward overlay (FULL)
function TileIcon({
  id, reward, size = 40,
}: { id: number; reward: "gold" | "crystal" | null | undefined; size?: number }) {
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <img
        src={`/tiles/${id}.png`}
        alt={`Tile ${id}`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
      />
      {reward === "gold" && (
        <img
          src="/tiles/gold.png"
          alt="Gold"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
        />
      )}
      {reward === "crystal" && (
        <img
          src="/tiles/crystal.png"
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

  // local anim ghost (bergerak lintas sel)
  const [animGhost, setAnimGhost] = useState<{
    color: ExplorerColor
    from8: { r: number; c: number }
    to8: { r: number; c: number }
    stage: 1 | 2 | 3
  } | null>(null)

  const playerName = (history.state as any)?.playerName || "Unknown"
  const playerId = getPlayerId(playerName)

  useEffect(() => {
    const off1 = onValue(ref(db, `games/karuba/${gameId}`), (s) => setGame(s.val()))
    const off2 = onValue(ref(db, `games/karuba/${gameId}/players`), (s) =>
      setPlayers(s.val() || {})
    )
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
          round: 0, currentTile: 0,
          status: "waiting", statusText: "Waiting host to start the game",
        })
      }
      const plist = await get(ref(db, `games/karuba/${gameId}/players`))
      const pObj = plist.val() || {}
      await update(gRef, { playersCount: Object.keys(pObj).length })
    }
    boot().catch(()=>{})
  }, [db, gameId])

  const me: Player | undefined = players[playerId]
  const order: string[] = useMemo(
    () => Object.values(players).sort((a,b)=>a.joinedAt - b.joinedAt).map(p=>p.id),
    [players]
  )

  const isHost = !!game && game.shuffleTurnUid === playerId
  const isGenerateTurnOwner = !!game && game.generateTurnUid === playerId

  const canGenerate =
    !!game &&
    (game.status === "waiting"
      ? isHost
      : game.status === "playing" && game.round >= 2 && isGenerateTurnOwner && game.currentTile === 0)

  const playerNameById = (pid: string) => players[pid]?.name || "player"

  const waitingLabel =
    !game ? "Loading..." :
    game.status === "waiting" ? "Waiting host to start the game" :
    game.round === 1 ? "Place or discard your tile, then move explorers if any" :
    isGenerateTurnOwner ? "You can generate now" :
    `Waiting for ${playerNameById(game.generateTurnUid)} to generate tile`

  // ====== Handlers ======
  const onStartOrGenerate = async () => {
    try {
      if (!game) return
      if (game.status === "waiting") {
        if (!isHost) return
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
        })
        for (const pid of pids) {
          await update(ref(db, `games/karuba/${gameId}/players/${pid}`), {
            actedForRound: false, doneForRound: false, lastAction: null
          })
        }
        return
      }
      if (game.status === "playing" && game.round >= 2) {
        if (!isGenerateTurnOwner || game.currentTile !== 0) return
        await update(ref(db, `games/karuba/${gameId}`), {
          currentTile: game.round, statusText: `Round ${game.round}`,
        })
      }
    } catch (e:any) { setError(e.message) }
  }

  const placeTile = async (r: number, c: number) => {
    try {
      if (!game || !me) return
      if (game.currentTile <= 0) return
      if (me.actedForRound) return
      const board = me.board.map(row => row.slice())
      if (board[r][c] !== -1) return
      board[r][c] = game.currentTile

      await update(ref(db, `games/karuba/${gameId}/players/${playerId}`), {
        board,
        actedForRound: true,
        lastAction: "placed",
        usedTiles: { ...(me.usedTiles || {}), [game.currentTile]: true },
      })
    } catch (e:any) { setError("Place tile error: "+e.message) }
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
        discardedTiles: [ ...(me.discardedTiles || []), tileId ],
        usedTiles: { ...(me.usedTiles || {}), [tileId]: true },
      })
    } catch (e:any) { setError("Discard error: "+e.message) }
  }

  const onReadyNextRound = async () => {
    try {
      if (!game || !me) return
      if (!me.actedForRound || me.doneForRound) return
      await update(ref(db, `games/karuba/${gameId}/players/${playerId}`), { doneForRound: true })
      await maybeAdvanceRound()
    } catch (e:any) { setError("Ready error: "+e.message) }
  }

  const maybeAdvanceRound = async () => {
    if (!game) return
    const plist = await get(ref(db, `games/karuba/${gameId}/players`))
    const pObj: Record<string, Player> = (plist.val() || {}) as any
    const allReady = Object.values(pObj).every(p => p.doneForRound)
    if (!allReady) return

    const pids = order
    const nextRound = game.round + 1
    if (nextRound > 36) {
      await update(ref(db, `games/karuba/${gameId}`), { status: "ended", statusText: "Game ended" })
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
        actedForRound: false, doneForRound: false, lastAction: null
      })
    }
  }

  // ====== MOVE 1 GRID (0.5s anim: start→mid→finish) ======
  const moveOne = async (color: ExplorerColor, dir: Branch) => {
    try {
      if (!game || !me) return
      if (me.moves <= 0) return
      const ex = me.explorers[color]; if (!ex) return

      // Helper untuk jalur valid & posisi tujuan
      const validateInternalMove = (r: number, c: number, entry: Branch, dir: Branch) => {
        const tid = me.board[r][c]; if (tid === -1) return null
        const meta = tilesMeta[String(tid)]
        if (!meta?.branches?.includes(dir) || dir === entry) return null
        let nr = r, nc = c
        if (dir === "N") nr = r - 1
        if (dir === "S") nr = r + 1
        if (dir === "E") nc = c + 1
        if (dir === "W") nc = c - 1
        if (nr < 0 || nr > 5 || nc < 0 || nc > 5) return null
        const nextTid = me.board[nr][nc]; if (nextTid === -1) return null
        const nextMeta = tilesMeta[String(nextTid)]
        if (!nextMeta?.branches?.includes(opp(dir))) return null
        return { nr, nc }
      }

      const setGhostStagesAndCommit = async (from8: {r:number;c:number}, to8: {r:number;c:number}, afterCommit: () => Promise<void>) => {
        setAnimGhost({ color, from8, to8, stage: 1 })
        await new Promise(r => setTimeout(r, 150)) // ~0.15s
        setAnimGhost({ color, from8, to8, stage: 2 })
        await new Promise(r => setTimeout(r, 150)) // ~0.30s
        setAnimGhost({ color, from8, to8, stage: 3 })
        await new Promise(r => setTimeout(r, 200)) // ~0.50s
        await afterCommit()
        setAnimGhost(null)
      }

      // Masuk dari tepi → ke tile pertama
      if (ex.onEdge) {
        const { side, index } = ex.onEdge
        let r = -1, c = -1
        if (side === "W") { r = index; c = 0 }
        else if (side === "S") { r = 5; c = index }
        else if (side === "E") { r = index; c = 5 }
        else { r = 0; c = index }

        const tid = me.board[r][c]; if (tid === -1) return
        const meta = tilesMeta[String(tid)]
        if (!meta?.branches?.includes(side)) return

        // ghost path (8x8 coords)
        const from8 =
          side === "W" ? { r: r + 1, c: 0 } :
          side === "S" ? { r: 7, c: c + 1 } :
          side === "E" ? { r: r + 1, c: 7 } :
                         { r: 0, c: c + 1 }
        const to8 = { r: r + 1, c: c + 1 }

        await setGhostStagesAndCommit(from8, to8, async () => {
          await update(ref(db, `games/karuba/${gameId}/players/${playerId}`), {
            moves: me.moves - 1,
            explorers: { ...me.explorers, [color]: { color, onBoard: { r, c, entry: side } } },
          })
        })
        return
      }

      // Langkah di dalam board
      if (ex.onBoard) {
        const { r, c, entry } = ex.onBoard
        const res = validateInternalMove(r, c, entry, dir)
        if (!res) return
        const { nr, nc } = res

        const from8 = { r: r + 1, c: c + 1 }
        const to8 = { r: nr + 1, c: nc + 1 }

        await setGhostStagesAndCommit(from8, to8, async () => {
          const nextOnBoard = { r: nr, c: nc, entry: opp(dir) }
          await update(ref(db, `games/karuba/${gameId}/players/${playerId}`), {
            moves: me.moves - 1,
            explorers: { ...me.explorers, [color]: { color, onBoard: nextOnBoard } },
          })
        })
      }
    } catch (e:any) { setError("Explorer step error: " + e.message) }
  }

  // === Masuk ke temple (N/E) ===
  const enterTemple = async (color: ExplorerColor, side: Branch, index: number) => {
    try {
      if (!game || !me) return
      if (me.moves <= 0) return
      if (!["N","E"].includes(side)) return

      const ex = me.explorers[color]; if (!ex?.onBoard) return
      const { r, c, entry } = ex.onBoard

      const tid = me.board[r][c]; if (tid === -1) return
      const meta = tilesMeta[String(tid)]
      const neededDir: Branch = side === "N" ? "N" : "E"
      if (!meta?.branches?.includes(neededDir) || neededDir === entry) return

      const wins: TempleWin[] = game.templeWins || []
      const already = wins.filter(w => w.side === side && w.index === index)
      if (already.length > 0) return

      // ghost path toward border cell
      const from8 = { r: r + 1, c: c + 1 }
      const to8 = side === "N" ? { r: 0, c: c + 1 } : { r: r + 1, c: 7 }

      await (async () => {
        // 0.5s anim
        setAnimGhost({ color, from8, to8, stage: 1 })
        await new Promise(r => setTimeout(r, 150))
        setAnimGhost({ color, from8, to8, stage: 2 })
        await new Promise(r => setTimeout(r, 150))
        setAnimGhost({ color, from8, to8, stage: 3 })
        await new Promise(r => setTimeout(r, 200))
      })()

      const sameColorWins = wins.filter(w => w.color === color).length
      const order = sameColorWins + 1
      const gain = ORDER_POINTS[Math.min(order - 1, ORDER_POINTS.length - 1)] || 1
      const newWins = [...wins, { side, index, color, playerId, order }]

      const newExplorers = { ...me.explorers }
      delete newExplorers[color]

      await update(ref(db, `games/karuba/${gameId}`), { templeWins: newWins })
      await update(ref(db, `games/karuba/${gameId}/players/${playerId}`), {
        moves: me.moves - 1,
        explorers: newExplorers,
        score: me.score + gain,
      })

      setAnimGhost(null)
    } catch (e:any) { setError("Explorer step error: " + e.message) }
  }

  if (error) return <div style={{ padding: 16, color: "red" }}>{error}</div>
  if (!game || !me) return <div style={{ padding: 16 }}>Loading game...</div>

  const canPlace = game.status === "playing" && game.currentTile > 0 && !me.actedForRound
  const canDiscard = canPlace

  const handleTrash = () => {
    if (!canDiscard || game.currentTile <= 0) return
    const branches = tilesMeta[String(game.currentTile)]?.branches || []
    if (confirm(`Discard tile? Gain +${branches.length} moves.`)) {
      discardTile(game.currentTile, branches)
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Game {gameId}</h2>
      <p>Status: {game.statusText} | Round: {game.round} | Current Tile: {game.currentTile || "-"}</p>

      {/* SCOREBOARD */}
      <div style={{ margin: "8px 0 12px" }}>
        <h3>Players</h3>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {Object.values(players)
            .sort((a,b)=>a.joinedAt-b.joinedAt)
            .map(p => {
              const isTurn = game.generateTurnUid === p.id && game.round >= 2 && game.currentTile === 0
              const state = p.doneForRound ? "ready ✓" : p.actedForRound ? "placed tile" : "playing"
              return (
                <li key={p.id} style={{ marginBottom: 4, fontWeight: isTurn ? 700 : 400, color: "#111" }}>
                  {p.name} — Score: {p.score} ({state})
                </li>
              )
            })}
        </ul>
      </div>

      {/* Controls */}
      <Controls
        isHost={isHost}
        status={game.status}
        round={game.round}
        canGenerate={!!canGenerate}
        onStartOrGenerate={onStartOrGenerate}
        onReady={onReadyNextRound}
        readyDisabled={!me.actedForRound || me.doneForRound}
        waitingLabel={waitingLabel}
      />

      {/* Current Tile bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "12px 0" }}>
        <strong>Current Tile:</strong>
        {me.actedForRound && me.lastAction
          ? <span>{me.lastAction === "placed" ? "Placed!" : "Discarded!"}</span>
          : (game.currentTile > 0 ? (
              <TileIcon id={game.currentTile} reward={game.rewards[game.currentTile]} size={40} />
            ) : <span>-</span>)
        }
        <span style={{ marginLeft: 8 }}>|</span>
        <span>Moves: {me.moves}</span>
        <img
          src="/trash.svg"
          alt="Trash"
          title={game.currentTile > 0 && canDiscard ? "Discard tile" : "No tile to discard"}
          onClick={handleTrash}
          style={{ width: 28, height: 28, cursor: game.currentTile > 0 && canDiscard ? "pointer" : "default", opacity: game.currentTile > 0 && canDiscard ? 1 : 0.5 }}
        />
        <button onClick={() => setShowDiscardList(true)} style={{ marginLeft: 4 }}>
          Discarded Tiles
        </button>
      </div>

      {/* Board */}
      <Board
        board={me.board}
        tilesMeta={tilesMeta}
        rewards={game.rewards}
        canPlace={canPlace}
        onPlace={placeTile}
        myMoves={me.moves}
        myExplorers={me.explorers}
        temples={game.layout?.temples || []}
        templeWins={game.templeWins || []}
        onMoveOne={moveOne}
        onEnterTemple={enterTemple}
        animGhost={animGhost}
      />

      {/* Discarded list modal */}
      {showDiscardList && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowDiscardList(false)}
        >
          <div style={{ background: "#fff", padding: 16, borderRadius: 10, width: 360 }} onClick={e=>e.stopPropagation()}>
            <h4 style={{ marginTop: 0 }}>Discarded Tiles</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {me.discardedTiles?.length
                ? me.discardedTiles.map((tid,i)=>(
                    <TileIcon key={`${tid}-${i}`} id={tid} reward={game.rewards[tid]} size={42} />
                  ))
                : <div>No discarded tiles</div>
              }
            </div>
            <div style={{ marginTop: 10, textAlign: "center" }}>
              <button onClick={()=>setShowDiscardList(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
    </div>
  )
}