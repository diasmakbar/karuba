import { useEffect, useState } from "react"
import { db, ref, onValue, update } from "../firebase"
import { getPlayerId } from "../lib/playerId"
import Board from "../components/Board"
import Controls from "../components/Controls"
import Scoreboard from "../components/Scoreboard"
import type { Game, Player } from "../lib/types"

export default function Room({ gameId }: { gameId: string }) {
  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Record<string, Player>>({})
  const [error, setError] = useState<string | null>(null)
  const playerId = getPlayerId()

  useEffect(() => {
    const off1 = onValue(ref(db, `games/karuba/${gameId}`), s => setGame(s.val()))
    const off2 = onValue(ref(db, `games/karuba/${gameId}/players`), s =>
      setPlayers(s.val() || {})
    )
    return () => {
      off1()
      off2()
    }
  }, [gameId])

//   const me = players[playerId]
  const me = players[getPlayerId(meName)]

  // Start game by host
  const onStartGame = async () => {
    if (!game) return
    if (game.status !== "lobby") return
    if (game.shuffleTurnUid !== playerId) return // hanya host
    await update(ref(db, `games/karuba/${gameId}`), {
      status: "playing",
      round: 1,
      currentTile: game.deck[0]
    })
  }

  const onShuffle = async () => {
    try {
        if (!game) return
        if (game.shuffleTurnUid !== playerId) return
        if (game.currentTile !== null) return

        const newRound = game.round + 1
        if (newRound > 36) return

        const nextTile = game.deck[newRound - 1]

        // urutan player sesuai join order
        const pids = Object.keys(players).sort(
        (a, b) => players[a].joinedAt - players[b].joinedAt
        )
        const currentIndex = pids.indexOf(playerId)
        const nextPlayerId = pids[(currentIndex + 1) % pids.length]

        await update(ref(db, `games/karuba/${gameId}`), {
        round: newRound,
        currentTile: nextTile,
        shuffleTurnUid: nextPlayerId
        })
    } catch (e: any) {
        setError("Shuffle error: " + e.message)
    }
  }


  const onEndRound = async () => {
    try {
      if (!game) return
      await update(ref(db, `games/karuba/${gameId}`), { currentTile: null })
      for (const pid of Object.keys(players)) {
        await update(ref(db, `games/karuba/${gameId}/players/${pid}`), {
          doneForRound: false
        })
      }
    } catch (e: any) {
      setError("End round error: " + e.message)
    }
  }

  const placeTile = async (r: number, c: number) => {
    try {
      if (!game || game.currentTile == null) return
      const p = players[playerId]
      if (!p) return
      const board = p.board.map(row => row.slice())
      if (board[r][c] !== -1) return
      board[r][c] = game.currentTile
      const usedTiles = { ...(p.usedTiles || {}), [game.currentTile]: true }
      await update(ref(db, `games/karuba/${gameId}/players/${playerId}`), {
        board,
        usedTiles
      })
    } catch (e: any) {
      setError("Place tile error: " + e.message)
    }
  }

  if (error)
    return <div style={{ padding: 16, color: "red" }}>{error}</div>
  if (!game || !me) return <div style={{ padding: 16 }}>Loading game...</div>

  const isMyTurn = game.shuffleTurnUid === playerId && game.status === "playing"

  return (
    <div style={{ padding: 16 }}>
      <h2>Game {gameId}</h2>
      <p>
        Round: {game.round} | Current Tile: {game.currentTile ?? "-"}
      </p>
      <p>
        Shuffle Turn:{" "}
        {game.shuffleTurnUid === playerId ? "Your turn" : game.shuffleTurnUid}
      </p>

      {game.status === "lobby" && game.shuffleTurnUid === playerId ? (
        <button onClick={onStartGame}>Start Game</button>
      ) : (
        <Controls
            isHost={game.shuffleTurnUid === playerId}
            status={game.status}
            isMyTurn={isMyTurn}
            currentTile={game.currentTile}
            onStart={onStartGame}
            onShuffle={onShuffle}
            onEndRound={onEndRound}
        />

      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          marginTop: 16
        }}
      >
        <div>
          <h3>
            {me.name} — Score: {me.score}
          </h3>
          <Board
            board={me.board}
            rewards={game.rewards}
            onPlace={placeTile}
          />
        </div>
        <div>
          <Scoreboard players={players} shuffleTurnUid={game.shuffleTurnUid} />
        </div>
      </div>
    </div>
  )
}
