import { useState } from "react"
import { db, ref, set, get } from "../firebase"
import { getPlayerId } from "../lib/playerId"
import { makeDeck } from "../lib/deck"
import { makeRewards } from "../lib/rewards"
import type { Game, Player, Board, ExplorerState, ExplorerColor, Branch } from "../lib/types"

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Utility: ambil K index unik dari [0..5]
function pickKDistinct(k: number): number[] {
  const pool = [0,1,2,3,4,5]
  const out: number[] = []
  for (let i=0; i<k; i++) {
    const j = Math.floor(Math.random() * pool.length)
    out.push(pool[j])
    pool.splice(j,1)
  }
  return out
}

const EXPLORER_COLORS: ExplorerColor[] = ["blue","yellow","brown","red"]

export default function Lobby() {
  const [name, setName] = useState("")
  const [joinId, setJoinId] = useState("")
  const playerId = getPlayerId(name)

  const buildRandomLayout = () => {
    // 4 explorers: 2 di sisi W (A2..A7), 2 di sisi S (B8..G8)
    const leftIdx = pickKDistinct(2) // baris 0..5
    const bottomIdx = pickKDistinct(2) // kolom 0..5
    const explorers: ExplorerState[] = [
      { color: "blue",  onEdge: { side: "W", index: leftIdx[0] } },
      { color: "yellow",onEdge: { side: "W", index: leftIdx[1] } },
      { color: "brown", onEdge: { side: "S", index: bottomIdx[0] } },
      { color: "red",   onEdge: { side: "S", index: bottomIdx[1] } },
    ]

    // 4 temples: 2 di sisi E (H2..H7), 2 di sisi N (B1..G1)
    const rightIdx = pickKDistinct(2)
    const topIdx   = pickKDistinct(2)
    const temples = [
      { side: "E" as Branch, index: rightIdx[0], color: "blue"   as ExplorerColor },
      { side: "E" as Branch, index: rightIdx[1], color: "yellow" as ExplorerColor },
      { side: "N" as Branch, index: topIdx[0],   color: "brown"  as ExplorerColor },
      { side: "N" as Branch, index: topIdx[1],   color: "red"    as ExplorerColor },
    ]
    return { explorersStart: explorers, temples }
  }

  const createGame = async () => {
    if (!name.trim()) {
      alert("Masukkan nama dulu")
      return
    }

    const gid = Math.random().toString(36).slice(2, 7).toUpperCase()
    const deck = makeDeck()
    const rewards = makeRewards()
    const board: Board = Array.from({ length: 6 }, () => Array(6).fill(-1))
    const layout = buildRandomLayout()

    // inisialisasi game state
    const game: Game = {
      id: gid,
      status: "waiting",
      statusText: "Waiting host to start the game",
      createdAt: Date.now(),
      deck,
      round: 0,
      currentTile: 0,
      shuffleTurnUid: playerId, // host id (owner)
      boardSize: 6,
      rules: { noRotation: true, infiniteRewards: true },
      layout,
      rewards,
      playersCount: 1,
      generateTurnIndex: 0, // akan diatur saat selesai Round 1 → mulai dari player urutan ke-2
      generateTurnUid: playerId, // placeholder
    }

    await set(ref(db, `games/karuba/${gid}`), game)

    // siapkan explorer per-player = copy dari layout
    const myExplorers: Record<ExplorerColor, ExplorerState> = {
      blue:   { color: "blue",   onEdge: { ...layout.explorersStart.find(e=>e.color==="blue")!.onEdge! } },
      yellow: { color: "yellow", onEdge: { ...layout.explorersStart.find(e=>e.color==="yellow")!.onEdge! } },
      brown:  { color: "brown",  onEdge: { ...layout.explorersStart.find(e=>e.color==="brown")!.onEdge! } },
      red:    { color: "red",    onEdge: { ...layout.explorersStart.find(e=>e.color==="red")!.onEdge! } },
    }

    const me: Player = {
      id: playerId,
      name,
      joinedAt: Date.now(),
      board,
      usedTiles: {},
      explorers: myExplorers,
      score: 0,
      doneForRound: false,
      moves: 0,
      discardedTiles: []
    }

    await set(ref(db, `games/karuba/${gid}/players/${playerId}`), me)

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

    // explorer per-player = copy dari layout game
    const myExplorers: Record<ExplorerColor, ExplorerState> = {
      blue:   { color: "blue",   onEdge: { ...g.layout.explorersStart.find((e:any)=>e.color==="blue").onEdge } },
      yellow: { color: "yellow", onEdge: { ...g.layout.explorersStart.find((e:any)=>e.color==="yellow").onEdge } },
      brown:  { color: "brown",  onEdge: { ...g.layout.explorersStart.find((e:any)=>e.color==="brown").onEdge } },
      red:    { color: "red",    onEdge: { ...g.layout.explorersStart.find((e:any)=>e.color==="red").onEdge } },
    }

    const me: Player = {
      id: playerId,
      name,
      joinedAt: Date.now(),
      board,
      usedTiles: {},
      explorers: myExplorers,
      score: 0,
      doneForRound: false,
      moves: 0,
      discardedTiles: []
    }

    await set(ref(db, `games/karuba/${gid}/players/${playerId}`), me)

    // update playersCount cache
    const newCount = (g.players ? Object.keys(g.players).length : 0) + 1
    await set(ref(db, `games/karuba/${gid}/playersCount`), newCount)

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
