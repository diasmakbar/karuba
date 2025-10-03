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

// === Reward sekali per player ===
const rewardGain = (tileId: number | null | undefined, player: Player, game: Game): number => {
  if (!tileId || !game?.rewards) return 0
  if (player.claimedRewards?.[tileId]) return 0
  const r = game.rewards[tileId]
  return r === "gold" ? 2 : r === "crystal" ? 1 : 0
}
const rewardKind = (tileId: number | null | undefined, game: Game) =>
  tileId && game?.rewards ? game.rewards[tileId] : null

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

  const isHost = !!game && game.shuffleTurnUid === playerId
  const isGenerateTurnOwner = !!game && game.generateTurnUid === playerId

  const canGenerate =
    !!game &&
    (game.status === "waiting"
      ? isHost
      : game.status === "playing" && game.round >= 2 && isGenerateTurnOwner && game.currentTile === 0)

  // === Endgame helpers ===
  const computeEveryoneFinished = async (): Promise<boolean> => {
    const plist = await get(ref(db, `games/karuba/${gameId}/players`))
    const pObj: Record<string, Player> = (plist.val() || {}) as any
    return Object.values(pObj || {}).every((p) => Object.keys(p.explorers || {}).length === 0)
  }

  const endGame = async () => {
    try {
      const playersSnap = await get(ref(db, `games/karuba/${gameId}/players`))
      const playersObj: Record<string, Player> = playersSnap.val() || {}

      // urutkan siapa duluan selesai
      const finished = Object.values(playersObj)
        .filter(p => p.finishedAtRound != null)
        .sort((a, b) => a.finishedAtRound! - b.finishedAtRound!)

      let placement = 1
      for (const p of finished) {
        const baseBonus = Math.min(36 - (p.finishedAtRound || 36), 8)
        let extra = 0
        if (placement === 1) extra = 2
        if (placement === 2) extra = 1
        placement++
        await update(ref(db, `games/karuba/${gameId}/players/${p.id}`), {
          score: p.score + baseBonus + extra,
          bonusPoints: baseBonus + extra
        })
      }

      await update(ref(db, `games/karuba/${gameId}`), { status: "ended", statusText: "Game ended" })
    } catch (e: any) {
      console.error(e)
    }
  }

  // === Place Tile ===
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

  // === Move ===
  const moveOne = async (color: ExplorerColor, dir: Branch) => {
    try {
      if (!game || !me) return
      if (me.moves <= 0) return
      const ex = me.explorers[color]
      if (!ex) return

      const tilesMeta = (game.tilesMeta || {}) as Record<string, { branches: Branch[] }>

      const oppBranch = (b: Branch): Branch =>
        b === "N" ? "S" : b === "S" ? "N" : b === "E" ? "W" : "E"

      const validateInternalMove = (r: number, c: number, entry: Branch, d: Branch) => {
        const tid = me.board[r][c]
        if (tid === -1) return null
        const meta = tilesMeta[String(tid)]
        if (!meta?.branches?.includes(d)) return null

        let nr = r, nc = c
        if (d === "N") nr = r - 1
        if (d === "S") nr = r + 1
        if (d === "E") nc = c + 1
        if (d === "W") nc = c - 1
        if (nr < 0 || nr > 5 || nc < 0 || nc > 5) return null

        const nextTid = me.board[nr][nc]
        if (nextTid === -1) return null
        const nextMeta = tilesMeta[String(nextTid)]
        if (!nextMeta?.branches?.includes(oppBranch(d))) return null
        return { nr, nc, nextTid }
      }

      // inside board
      if (ex.onBoard) {
        const { r, c, entry } = ex.onBoard
        const res = validateInternalMove(r, c, entry, dir)
        if (!res) return
        const { nr, nc, nextTid } = res

        const gain = rewardGain(nextTid, me, game)
        const kind = rewardKind(nextTid, game)

        const newScore = me.score + gain
        const claimed = { ...(me.claimedRewards || {}) }
        if (gain > 0) claimed[nextTid] = true

        await update(ref(db, `games/karuba/${gameId}/players/${playerId}`), {
          moves: me.moves - 1,
          score: newScore,
          goldCount: (me as any).goldCount + (kind === "gold" ? 1 : 0),
          crystalCount: (me as any).crystalCount + (kind === "crystal" ? 1 : 0),
          claimedRewards: claimed,
          explorers: { ...me.explorers, [color]: { color, onBoard: { r: nr, c: nc, entry: oppBranch(dir) } } },
        })
      }
    } catch (e: any) {
      setError("Explorer move error: " + e.message)
    }
  }

  // === Enter Temple ===
  const enterTemple = async (color: ExplorerColor, side: Branch, index: number) => {
    try {
      if (!game || !me) return
      if (me.moves <= 0) return

      const temple = game.layout?.temples?.find((t) => t.side === side && t.index === index)
      if (!temple || temple.color !== color) return

      const newExplorers = { ...me.explorers }
      delete newExplorers[color]

      const wins = (game.templeWins || []) as any[]
      const newWins = [...wins, { side, index, color, playerId }]

      const finishedNow = Object.keys(newExplorers).length === 0

      await update(ref(db, `games/karuba/${gameId}`), { templeWins: newWins })
      await update(ref(db, `games/karuba/${gameId}/players/${playerId}`), {
        moves: me.moves - 1,
        explorers: newExplorers,
        score: me.score, // poin temple sudah lewat reward tile
        finishedAtRound: finishedNow ? game.round : me.finishedAtRound
      })

      const everyoneFinished = await computeEveryoneFinished()
      if (everyoneFinished) {
        await endGame()
      }
    } catch (e: any) {
      setError("Temple error: " + e.message)
    }
  }

  if (error) return <div style={{ padding: 16, color: "red" }}>{error}</div>
  if (!game || !me) return <div style={{ padding: 16 }}>Loading game...</div>

  return (
    <main className="page">
      {/* UI lama tetap */}
      <div className="page-inner">
        <h2>Karuba Online</h2>
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
    </main>
  )
    }
