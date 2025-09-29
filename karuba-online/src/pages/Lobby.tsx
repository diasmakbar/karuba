import { useState } from "react"
import { db, ref, set, get, update } from "../firebase"
import { getPlayerId } from "../lib/playerId"
import { makeRewards } from "../lib/rewards"
import type { Game, Player, Board } from "../lib/types"

export default function Lobby() {
  const [name, setName] = useState("")
  const [joinId, setJoinId] = useState("")
  const playerId = getPlayerId(name)

  const newGameId = () => Math.random().toString(36).slice(2, 7).toUpperCase()
  const emptyBoard = (): Board =>
    Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => -1 as const))

  const defaultLayout = () => ({
    explorers: {
      red:   { side: "W" as const, index: 1 },
      blue:  { side: "W" as const, index: 3 },
      brown: { side: "S" as const, index: 2 },
      yellow:{ side: "S" as const, index: 4 },
    },
    temples: [
      { side: "N" as const, index: 1, color: "red" as const },
      { side: "N" as const, index: 4, color: "yellow" as const },
      { side: "E" as const, index: 1, color: "blue" as const },
      { side: "E" as const, index: 4, color: "brown" as const },
    ],
  })

  const createPlayerPayload = (id: string, pname: string) => {
    const layout = defaultLayout()
    return {
      id,
      name: pname,
      joinedAt: Date.now(),
      board: emptyBoard(),
      usedTiles: {},
      discardedTiles: [],
      explorers: {
        red:   { color: "red",   onEdge: layout.explorers.red },
        blue:  { color: "blue",  onEdge: layout.explorers.blue },
        brown: { color: "brown", onEdge: layout.explorers.brown },
        yellow:{ color: "yellow",onEdge: layout.explorers.yellow },
      },
      moves: 0,
      score: 0,
      actedForRound: false,
      doneForRound: false,
      lastAction: null,
    } as unknown as Player
  }

  const createGame = async () => {
    if (!name.trim()) { alert("Masukkan nama dulu"); return }
    const gameId = newGameId()
    const rewards = makeRewards()

    const gamePayload: Partial<Game> & any = {
      status: "waiting",
      statusText: "Waiting host to start the game",
      round: 0,
      currentTile: 0,
      playersCount: 1,
      shuffleTurnUid: playerId, // host
      generateTurnIndex: 0,
      generateTurnUid: "",
      layout: defaultLayout(),
      rewards,
      templeWins: [],
      players: {},
    }

    await set(ref(db, `games/karuba/${gameId}`), gamePayload)
    await set(
      ref(db, `games/karuba/${gameId}/players/${playerId}`),
      createPlayerPayload(playerId, name.trim())
    )

    history.pushState({ playerName: name.trim() }, "", `/room/${gameId}`)
    dispatchEvent(new PopStateEvent("popstate"))
  }

  const joinGame = async () => {
    if (!name.trim()) { alert("Masukkan nama dulu"); return }
    const gameId = joinId.trim().toUpperCase()
    if (!gameId) { alert("Masukkan Game ID"); return }

    const gSnap = await get(ref(db, `games/karuba/${gameId}`))
    if (!gSnap.exists()) { alert("Game tidak ditemukan"); return }

    const pSnap = await get(ref(db, `games/karuba/${gameId}/players/${playerId}`))
    if (!pSnap.exists()) {
      await set(
        ref(db, `games/karuba/${gameId}/players/${playerId}`),
        createPlayerPayload(playerId, name.trim())
      )
      const playersSnap = await get(ref(db, `games/karuba/${gameId}/players`))
      const count = playersSnap.exists() ? Object.keys(playersSnap.val() || {}).length : 1
      await update(ref(db, `games/karuba/${gameId}`), { playersCount: count })
    }

    history.pushState({ playerName: name.trim() }, "", `/room/${gameId}`)
    dispatchEvent(new PopStateEvent("popstate"))
  }

  return (
    <main className="page">
      <div className="page-inner" style={{ maxWidth: 520 }}>
        <div className="card">
          <h2 style={{ marginTop: 4 }} className="font-display">Karuba Online — Lobby</h2>

          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              placeholder="Nama kamu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ flex: 1 }}
            />
            <button onClick={createGame}>Create Game</button>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="Game ID"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              style={{ flex: 1 }}
            />
            <button onClick={joinGame}>Join Game</button>
          </div>
        </div>
      </div>
    </main>
  )
}