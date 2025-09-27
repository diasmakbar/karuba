import { useState } from "react"
import { db, ref, set, get } from "../firebase"
import { getPlayerId } from "../lib/playerId"
import { makeDeck } from "../lib/deck"
import { makeRewards } from "../lib/rewards"
import type { Game, Player, Board } from "../lib/types"

export default function Lobby() {
  const [name, setName] = useState("")
  const [joinId, setJoinId] = useState("")
  const playerId = getPlayerId(name)

  const createGame = async () => {
    if (!name.trim()) {
      alert("Masukkan nama dulu")
      return
    }

    const gid = Math.random().toString(36).slice(2, 7).toUpperCase()
    const deck = makeDeck()
    const rewards = makeRewards()
    const board: Board = Array.from({ length: 6 }, () => Array(6).fill(-1))

    const explorersStart = {
      brown: { r: 0, c: 5 },
      blue: { r: 0, c: 0 },
      yellow: { r: 5, c: 5 },
      purple: { r: 5, c: 0 }
    }

    // inisialisasi game state
    await set(ref(db, `games/karuba/${gid}`), {
      id: gid,
      status: "waiting",
      statusText: "Waiting host to start the game",
      createdAt: Date.now(),
      deck,
      round: 0,
      currentTile: 0,
      shuffleTurnUid: playerId, // host id
      boardSize: 6,
      rules: { noRotation: true, infiniteRewards: true },
      temples: {
        brown: { r: 5, c: 0 },
        blue: { r: 5, c: 5 },
        yellow: { r: 0, c: 0 },
        purple: { r: 0, c: 5 }
      },
      explorersStart,
      templeTokens: {
        brown: [5, 4, 3, 2],
        blue: [5, 4, 3, 2],
        yellow: [5, 4, 3, 2],
        purple: [5, 4, 3, 2]
      },
      rewards,
      players: {}
    } as Game)

    // tambahkan host sbg player pertama
    await set(ref(db, `games/karuba/${gid}/players/${playerId}`), {
      id: playerId,
      name,
      joinedAt: Date.now(),
      board,
      usedTiles: {},
      explorers: explorersStart,
      score: 0,
      doneForRound: false
    } as Player)

    history.pushState({ playerName: name }, "", `/room/${gid}`)
    dispatchEvent(new PopStateEvent("popstate"))
  }

  const joinGame = async () => {
    if (!name.trim()) {
      alert("Masukkan nama dulu")
      return
    }
    const gid = joinId.trim().toUpperCase()

    const snap = await get(ref(db, `games/karuba/${gid}`))
    if (!snap.exists()) {
      alert("Game not found")
      return
    }

    const g = snap.val() as Game
    // cek duplicate name
    const existingPlayer = Object.values(g.players || {}).find(
      (p: any) => p.name.toLowerCase() === name.toLowerCase()
    )
    if (existingPlayer) {
      alert("Player name already exists in this game. Please choose a different name.")
      return
    }

    const board: Board = Array.from({ length: 6 }, () => Array(6).fill(-1))

    await set(ref(db, `games/karuba/${gid}/players/${playerId}`), {
      id: playerId,
      name,
      joinedAt: Date.now(),
      board,
      usedTiles: {},
      explorers: g.explorersStart,
      score: 0,
      doneForRound: false
    } as Player)

    history.pushState({ playerName: name }, "", `/room/${gid}`)
    dispatchEvent(new PopStateEvent("popstate"))
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Karuba Lobby</h2>
      <input
        placeholder="Your name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <button onClick={createGame}>Create Game</button>

      <div style={{ marginTop: 8 }}>
        <input
          placeholder="Game ID"
          value={joinId}
          onChange={e => setJoinId(e.target.value)}
        />
        <button onClick={joinGame}>Join Game</button>
      </div>
    </div>
  )
}
