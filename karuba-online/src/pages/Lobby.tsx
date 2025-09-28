import { useState } from "react"
import { db, ref, set, get } from "../firebase"
import { getPlayerId } from "../lib/playerId"
import { makeDeck } from "../lib/deck"
import { makeRewards } from "../lib/rewards"
import type { Game, Player, Board, ExplorerState, ExplorerColor, Branch } from "../lib/types"

const COLORS: ExplorerColor[] = ["blue", "yellow", "brown", "red"] // urutan bebas; warna ke file di Board.tsx

function pickKDistinct(nums: number[], k: number) {
  const pool = [...nums]
  const out: number[] = []
  for (let i = 0; i < k; i++) {
    const j = Math.floor(Math.random() * pool.length)
    out.push(pool[j])
    pool.splice(j, 1)
  }
  return out
}

export default function Lobby() {
  const [name, setName] = useState("")
  const [joinId, setJoinId] = useState("")
  const playerId = getPlayerId(name)

  const buildRandomLayout = (): GameLayout => {
    // ===== Temples (atas=N index 0..5 = B1..G1) & (kanan=E index 0..5 = H2..H7)
    // Rule: G1 (top index 5) dan H2 (right index 0) tidak boleh keduanya terisi.
    // Kita isi 2 top + 2 right dengan warna berbeda.
    let topIdxCandidates = [0, 1, 2, 3, 4, 5]
    let rightIdxCandidates = [0, 1, 2, 3, 4, 5]

    // sementara draft
    let topIdx = pickKDistinct(topIdxCandidates, 2)
    let rightIdx = pickKDistinct(rightIdxCandidates, 2)

    // enforce G1 & H2 constraint
    const bothConflict = topIdx.includes(5) && rightIdx.includes(0)
    if (bothConflict) {
      // ganti salah satu secara acak
      if (Math.random() < 0.5) {
        topIdx = pickKDistinct([0, 1, 2, 3, 4], 2) // hindari 5
      } else {
        rightIdx = pickKDistinct([1, 2, 3, 4, 5], 2) // hindari 0
      }
    }

    // assign warna unik untuk 4 temples
    const shuffledColors = [...COLORS].sort(() => Math.random() - 0.5)
    const temples = [
      { side: "N" as Branch, index: topIdx[0], color: shuffledColors[0] },
      { side: "N" as Branch, index: topIdx[1], color: shuffledColors[1] },
      { side: "E" as Branch, index: rightIdx[0], color: shuffledColors[2] },
      { side: "E" as Branch, index: rightIdx[1], color: shuffledColors[3] },
    ]

    // ===== Explorers (kiri=W index 0..5 = A2..A7) & (bawah=S index 0..5 = B8..G8)
    // Rule: A7 (W idx 5) dan B8 (S idx 0) tidak boleh keduanya ada.
    let leftIdx = pickKDistinct([0, 1, 2, 3, 4, 5], 2)
    let bottomIdx = pickKDistinct([0, 1, 2, 3, 4, 5], 2)
    if (leftIdx.includes(5) && bottomIdx.includes(0)) {
      if (Math.random() < 0.5) leftIdx = pickKDistinct([0, 1, 2, 3, 4], 2)
      else bottomIdx = pickKDistinct([1, 2, 3, 4, 5], 2)
    }

    // Map explorers ke warna tetap: kiri dapat 2 warna, bawah dapat 2 warna
    // biar warna sebar: ambil 2 warna pertama untuk kiri, 2 berikutnya ke bawah
    const eColors = [...COLORS].sort(() => Math.random() - 0.5)
    const explorers: ExplorerState[] = [
      { color: eColors[0], onEdge: { side: "W", index: leftIdx[0] } },
      { color: eColors[1], onEdge: { side: "W", index: leftIdx[1] } },
      { color: eColors[2], onEdge: { side: "S", index: bottomIdx[0] } },
      { color: eColors[3], onEdge: { side: "S", index: bottomIdx[1] } },
    ]

    // Rule 3:
    // - explorers di A2/A3 (W idx 0/1) → temples warna tsb JANGAN di B1/C1 (N idx 0/1)
    // - explorers di F8/G8 (S idx 4/5) → temples warna tsb JANGAN di H6/H7 (E idx 4/5)
    const templesBySide = {
      N: temples.filter(t => t.side === "N"),
      E: temples.filter(t => t.side === "E"),
    }

    const violatesNorth = (color: ExplorerColor) =>
      explorers.some(e => e.color === color && e.onEdge?.side === "W" && [0,1].includes(e.onEdge.index)) &&
      templesBySide.N.some(t => t.color === color && [0,1].includes(t.index))

    const violatesEast = (color: ExplorerColor) =>
      explorers.some(e => e.color === color && e.onEdge?.side === "S" && [4,5].includes(e.onEdge.index)) &&
      templesBySide.E.some(t => t.color === color && [4,5].includes(t.index))

    // If violation, reshuffle temples positions for that color
    for (const color of COLORS) {
      if (violatesNorth(color)) {
        // move that color's N temple away from idx 0/1 (if exists)
        const tn = temples.find(t => t.side === "N" && t.color === color)
        if (tn) {
          const choices = [2,3,4,5].filter(i => !templesBySide.N.some(t => t.index === i))
          if (choices.length) tn.index = choices[Math.floor(Math.random()*choices.length)]
        }
      }
      if (violatesEast(color)) {
        const te = temples.find(t => t.side === "E" && t.color === color)
        if (te) {
          const choices = [0,1,2,3].filter(i => !templesBySide.E.some(t => t.index === i))
          if (choices.length) te.index = choices[Math.floor(Math.random()*choices.length)]
        }
      }
    }

    return { explorersStart: explorers, temples }
  }

  const createGame = async () => {
    if (!name.trim()) { alert("Masukkan nama dulu"); return }
    const gid = Math.random().toString(36).slice(2, 7).toUpperCase()
    const deck = makeDeck()
    const rewards = makeRewards()
    const board: Board = Array.from({ length: 6 }, () => Array(6).fill(-1))
    const layout = buildRandomLayout()

    const game: Game = {
      id: gid,
      status: "waiting",
      statusText: "Waiting host to start the game",
      createdAt: Date.now(),
      deck,
      round: 0,
      currentTile: 0,
      shuffleTurnUid: playerId,
      boardSize: 6,
      rules: { noRotation: true, infiniteRewards: true },
      layout,
      rewards,
      playersCount: 1,
      generateTurnIndex: 0,
      generateTurnUid: playerId,
    }

    await set(ref(db, `games/karuba/${gid}`), game)

    // player init (copy explorers from layout)
    const explorers: Record<ExplorerColor, ExplorerState> = {} as any
    for (const e of layout.explorersStart) explorers[e.color] = { color: e.color, onEdge: { ...e.onEdge! } }

    const me: Player = {
      id: playerId,
      name,
      joinedAt: Date.now(),
      board,
      usedTiles: {},
      explorers,
      score: 0,
      actedForRound: false,
      doneForRound: false,
      moves: 0,
      discardedTiles: []
    }

    await set(ref(db, `games/karuba/${gid}/players/${playerId}`), me)
    history.pushState({ playerName: name }, "", `/room/${gid}`); dispatchEvent(new PopStateEvent("popstate"))
  }

  const joinGame = async () => {
    if (!name.trim()) { alert("Masukkan nama dulu"); return }
    const gid = joinId.trim().toUpperCase()

    const snap = await get(ref(db, `games/karuba/${gid}`))
    if (!snap.exists()) { alert("Game not found"); return }
    const g = snap.val() as Game

    // duplicate name check
    const exists = Object.values(g.players || {}).find((p: any) => p.name.toLowerCase() === name.toLowerCase())
    if (exists) { alert("Player name already exists in this game. Please choose a different name."); return }

    const board: Board = Array.from({ length: 6 }, () => Array(6).fill(-1))
    const explorers: Record<ExplorerColor, ExplorerState> = {} as any
    for (const e of g.layout.explorersStart) explorers[e.color] = { color: e.color, onEdge: { ...e.onEdge! } }

    const me: Player = {
      id: playerId,
      name,
      joinedAt: Date.now(),
      board,
      usedTiles: {},
      explorers,
      score: 0,
      actedForRound: false,
      doneForRound: false,
      moves: 0,
      discardedTiles: []
    }

    await set(ref(db, `games/karuba/${gid}/players/${playerId}`), me)
    const newCount = (g.players ? Object.keys(g.players).length : 0) + 1
    await set(ref(db, `games/karuba/${gid}/playersCount`), newCount)

    history.pushState({ playerName: name }, "", `/room/${gid}`); dispatchEvent(new PopStateEvent("popstate"))
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Karuba Lobby</h2>
      <input placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} />
      <button onClick={createGame}>Create Game</button>

      <div style={{ marginTop: 8 }}>
        <input placeholder="Game ID" value={joinId} onChange={e=>setJoinId(e.target.value)} />
        <button onClick={joinGame}>Join Game</button>
      </div>
    </div>
  )
}

type GameLayout = Game["layout"]
