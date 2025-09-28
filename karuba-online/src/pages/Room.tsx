import { useEffect, useMemo, useState } from "react"
import { db, ref, onValue, update, get, set } from "../firebase"
import { getPlayerId } from "../lib/playerId"
import Board from "../components/Board"
import Controls from "../components/Controls"
import Scoreboard from "../components/Scoreboard"
import type { Game, Player, Branch, ExplorerColor, TilesMetaMap } from "../lib/types"
import tilesMetaJson from "../lib/tiles.json" assert { type: "json" }

const tilesMeta = tilesMetaJson as TilesMetaMap

export default function Room({ gameId }: { gameId: string }) {
  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Record<string, Player>>({})
  const [error, setError] = useState<string | null>(null)

  const playerName = (history.state as any)?.playerName || "Unknown"
  const playerId = getPlayerId(playerName)

  // Subscribe game & players
  useEffect(() => {
    const off1 = onValue(ref(db, `games/karuba/${gameId}`), s => setGame(s.val()))
    const off2 = onValue(ref(db, `games/karuba/${gameId}/players`), s =>
      setPlayers(s.val() || {})
    )
    return () => { off1(); off2() }
  }, [gameId])

  // Inisialisasi fallback state awal bila belum ada
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
      // cache playersCount
      const plist = await get(ref(db, `games/karuba/${gameId}/players`))
      const pObj = plist.val() || {}
      await update(gRef, { playersCount: Object.keys(pObj).length })
    }
    boot().catch(()=>{})
  }, [db, gameId])

  const me = players[playerId]
  const order = useMemo(
    () => Object.values(players).sort((a,b)=>a.joinedAt - b.joinedAt).map(p=>p.id),
    [players]
  )

  if (error) return <div style={{ padding: 16, color: "red" }}>{error}</div>
  if (!game || !me) return <div style={{ padding: 16 }}>Loading game...</div>

  const isHost = game.shuffleTurnUid === playerId
  const isGenerateTurnOwner = game.generateTurnUid === playerId
  const allDone = Object.values(players).length > 0 && Object.values(players).every(p => p.doneForRound)

  // ===== Controls handlers =====
  const onStartOrGenerate = async () => {
    try {
      if (game.status === "waiting") {
        // START GAME by host → round 1, currentTile 1 (langsung tampil); generate turn index diarahkan ke pemain urutan-ke-2 utk round 2
        if (!isHost) return
        const pids = order
        const idxForRound2 = pids.length > 1 ? 1 : 0
        await update(ref(db, `games/karuba/${gameId}`), {
          status: "playing",
          statusText: "Round 1",
          round: 1,
          currentTile: 1,
          generateTurnIndex: idxForRound2,
          generateTurnUid: pids[idxForRound2] || playerId
        })
        // reset doneForRound
        for (const pid of pids) {
          await update(ref(db, `games/karuba/${gameId}/players/${pid}`), { doneForRound: false })
        }
        return
      }

      // PLAYING:
      if (game.round >= 2) {
        // tombol aktif hanya untuk generateTurnOwner, dan hanya saat currentTile==0 (belum di-generate di round ini)
        if (!isGenerateTurnOwner || game.currentTile !== 0) return
        await update(ref(db, `games/karuba/${gameId}`), {
          currentTile: game.round,
          statusText: `Round ${game.round}`
        })
      }
    } catch (e:any) {
      setError(e.message)
    }
  }

  const canGenerate =
    game.status === "waiting" ? isHost :
    (game.status === "playing" && game.round >= 2 && isGenerateTurnOwner && game.currentTile === 0)

  const waitingLabel =
    game.status === "waiting"
      ? "Waiting host to start the game"
      : game.round === 1
      ? "Place or discard your tile"
      : isGenerateTurnOwner
      ? "You can generate now"
      : `Waiting for ${playerNameById(game.generateTurnUid)} to generate tile`

  function playerNameById(pid: string) {
    return players[pid]?.name || "player"
  }

  // ===== Placement / Discard logic =====
  const placeTile = async (r: number, c: number) => {
    try {
      if (game.currentTile <= 0) return
      if (me.doneForRound) return
      const board = me.board.map(row => row.slice())
      if (board[r][c] !== -1) return
      board[r][c] = game.currentTile

      await update(ref(db, `games/karuba/${gameId}/players/${playerId}`), {
        board,
        doneForRound: true,
        usedTiles: { ...(me.usedTiles || {}), [game.currentTile]: true }
      })

      // bila semua done → advance round (tanpa generate tile otomatis)
      await maybeAdvanceRound()
    } catch (e:any) { setError("Place tile error: "+e.message) }
  }

  const discardTile = async (tileId: number, branches: Branch[]) => {
    try {
      if (tileId !== game.currentTile) return
      if (me.doneForRound) return
      const gain = branches.length
      await update(ref(db, `games/karuba/${gameId}/players/${playerId}`), {
        moves: (me.moves || 0) + gain,
        lastDiscardDirs: branches,
        doneForRound: true,
        discardedTiles: [ ...(me.discardedTiles || []), tileId ],
        usedTiles: { ...(me.usedTiles || {}), [tileId]: true }
      })
      await maybeAdvanceRound()
    } catch (e:any) { setError("Discard error: "+e.message) }
  }

  const maybeAdvanceRound = async () => {
    const plist = await get(ref(db, `games/karuba/${gameId}/players`))
    const pObj: Record<string, Player> = plist.val() || {}
    const done = Object.values(pObj).every(p => p.doneForRound)
    if (!done) return
    // semua pemain selesai → round++ & kosongkan currentTile, set giliran generate ke pemain berikutnya
    const pids = order
    const nextRound = game.round + 1
    if (nextRound > 36) {
      await update(ref(db, `games/karuba/${gameId}`), { status: "ended", statusText: "Game ended" })
      return
    }
    // rotasi generate turn
    let nextIdx = game.generateTurnIndex
    if (nextRound === 2) {
      // sudah diset saat start game
      nextIdx = game.generateTurnIndex
    } else {
      nextIdx = (game.generateTurnIndex + 1) % pids.length
    }
    await update(ref(db, `games/karuba/${gameId}`), {
      round: nextRound,
      currentTile: 0, // menunggu pemain generate
      generateTurnIndex: nextIdx,
      generateTurnUid: pids[nextIdx] || pids[0],
      statusText: `Round ${nextRound} (waiting generate)`
    })
    // reset flags pemain
    for (const pid of pids) {
      await update(ref(db, `games/karuba/${gameId}/players/${pid}`), { doneForRound: false })
    }
  }

  // ===== Explorer step (1 grid) =====
  const stepExplorer = async (color: ExplorerColor) => {
    try {
      if (me.moves <= 0) return
      const ex = me.explorers[color]
      if (!ex) return

      // 1) kalau masih di tepi → coba masuk ke tile adjacent
      if (ex.onEdge) {
        const { side, index } = ex.onEdge
        let r = -1, c = -1, needBranch: Branch = opposite(side)
        if (side === "W") { r = index; c = 0 }
        else if (side === "S") { r = 5; c = index }
        else if (side === "E") { r = index; c = 5 }
        else { r = 0; c = index } // "N"

        const tid = me.board[r][c]
        if (tid === -1) return // belum bisa
        const meta = tilesMeta[String(tid)]
        if (!meta?.branches?.includes(side)) return // butuh pintu ke sisi explorer

        // masuk ke tile → entry adalah sisi kebalikan dari arah explorer datang
        const onBoard = { r, c, entry: needBranch }
        await update(ref(db, `games/karuba/${gameId}/players/${playerId}`), {
          moves: me.moves - 1,
          explorers: { ...me.explorers, [color]: { color, onBoard } }
        })
        return
      }

      // 2) kalau sudah onBoard → cari exit dan tile tetangga valid
      if (ex.onBoard) {
        const { r, c, entry } = ex.onBoard
        const tid = me.board[r][c]
        if (tid === -1) return
        const meta = tilesMeta[String(tid)]
        const exits = (meta?.branches || []).filter(b => b !== entry)
        if (exits.length === 0) return

        // pilih exit dengan prioritas NESW (sederhana)
        const priority: Branch[] = ["N","E","S","W"]
        let chosen: Branch | null = null
        for (const p of priority) if (exits.includes(p)) { chosen = p; break }
        if (!chosen) return

        // target tile
        let nr = r, nc = c
        if (chosen === "N") nr = r - 1
        if (chosen === "S") nr = r + 1
        if (chosen === "E") nc = c + 1
        if (chosen === "W") nc = c - 1
        if (nr < 0 || nr > 5 || nc < 0 || nc > 5) return

        const nextTid = me.board[nr][nc]
        if (nextTid === -1) return
        const nextMeta = tilesMeta[String(nextTid)]
        if (!nextMeta?.branches?.includes(opposite(chosen))) return

        const nextOnBoard = { r: nr, c: nc, entry: opposite(chosen) }
        await update(ref(db, `games/karuba/${gameId}/players/${playerId}`), {
          moves: me.moves - 1,
          explorers: { ...me.explorers, [color]: { color, onBoard: nextOnBoard } }
        })
      }
    } catch (e:any) { setError("Explorer step error: "+e.message) }
  }

  // ===== Derived flags =====
  const canPlace = game.status === "playing" && game.currentTile > 0 && !me.doneForRound

  return (
    <div style={{ padding: 16 }}>
      <h2>Game {gameId}</h2>
      <p>
        Status: {game.statusText} | Round: {game.round} | Current Tile: {game.currentTile || "-"}
      </p>

      <Controls
        isHost={isHost}
        status={game.status}
        round={game.round}
        canGenerate={canGenerate}
        onStartOrGenerate={onStartOrGenerate}
        waitingLabel={waitingLabel}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 16 }}>
        <div>
          <h3>
            {me.name} — Score: {me.score} {me.doneForRound ? "(✔ done)" : ""} — Moves: {me.moves}
          </h3>

          {/* current tile preview */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <span>Current Tile:</span>
            {game.currentTile>0 ? <img src={`/tiles/${game.currentTile}.png`} alt="" style={{ width: 40, height: 40 }} /> : <span>-</span>}
          </div>

          <Board
            board={me.board}
            tilesMeta={tilesMeta}
            rewards={game.rewards}
            canPlace={canPlace}
            onPlace={placeTile}
            onDiscard={discardTile}
            currentTile={game.currentTile}
            myMoves={me.moves}
            myExplorers={me.explorers}
            layoutExplorers={game.layout.explorersStart}
            temples={game.layout.temples}
            onExplorerStep={(color)=>stepExplorer(color)}
            discardedTiles={me.discardedTiles || []}
          />
        </div>

        <div>
          <Scoreboard players={players} generateTurnUid={game.generateTurnUid} />
        </div>
      </div>
    </div>
  )
}
