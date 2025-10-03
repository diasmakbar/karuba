import { useState } from "react"
import { db, ref, set, get, update } from "../firebase"
import { getPlayerId } from "../lib/playerId"
import { makeRewards } from "../lib/rewards"
import type { Game, Player, Board, ExplorerColor, Branch } from "../lib/types"

type Layout = {
  explorers: Record<ExplorerColor, { side: Branch; index: number }>
  temples: { side: Branch; index: number; color: ExplorerColor }[]
}

function makeRandomLayout(): Layout {
  const colors: ExplorerColor[] = ["red", "blue", "brown", "yellow"]

  const randPick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
  const shuffle = <T,>(arr: T[]) => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
  const pickK = (pool: number[], k: number) => shuffle(pool).slice(0, k)

  const colsShuffled = shuffle(colors)
  const topLeftColors: ExplorerColor[] = colsShuffled.slice(0, 2)
  const rightBottomColors: ExplorerColor[] = colsShuffled.slice(2)

  const topCols = pickK([1, 2, 3, 4, 5, 6], 2)
  const rightRows = pickK([1, 2, 3, 4, 5, 6], 2)
  const leftRows = pickK([1, 2, 3, 4, 5, 6], 2)
  const bottomCols = pickK([1, 2, 3, 4, 5, 6], 2)

  const topTemples = topLeftColors.map((color, i) => ({
    side: "N" as const,
    index: topCols[i] - 1,
    color,
  }))
  const rightTemples = rightBottomColors.map((color, i) => ({
    side: "E" as const,
    index: rightRows[i] - 1,
    color,
  }))

  const explorers: Record<ExplorerColor, { side: Branch; index: number }> = {
    [topLeftColors[0]]: { side: "W", index: leftRows[0] - 1 },
    [topLeftColors[1]]: { side: "W", index: leftRows[1] - 1 },
    [rightBottomColors[0]]: { side: "S", index: bottomCols[0] - 1 },
    [rightBottomColors[1]]: { side: "S", index: bottomCols[1] - 1 },
  }

  return {
    explorers,
    temples: [...topTemples, ...rightTemples],
  }
}

export default function Lobby() {
  const [name, setName] = useState("")
  const [joinId, setJoinId] = useState("")
  const playerId = getPlayerId(name)

  const newGameId = () => Math.random().toString(36).slice(2, 7).toUpperCase()
  const emptyBoard = (): Board =>
    Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => -1 as const))

  const createPlayerPayload = (id: string, pname: string, layout: Layout) => {
    return {
      id,
      name: pname,
      joinedAt: Date.now(),
      board: emptyBoard(),
      usedTiles: {},
      discardedTiles: [],
      explorers: {
        ...Object.fromEntries(
          (["red", "blue", "brown", "yellow"] as ExplorerColor[]).map((c) => [
            c,
            { color: c, onEdge: layout.explorers[c] },
          ])
        ),
      },
      moves: 0,
      score: 0,
      actedForRound: false,
      doneForRound: false,
      lastAction: null,
      goldCount: 0,
      crystalCount: 0,
      claimedRewards: {},       // ⬅️ baru: untuk track reward tile yg udah di-claim
      finishedAtRound: null,    // ⬅️ baru: untuk track ronde saat finish
    } as unknown as Player
  }

  const createGame = async () => {
    if (!name.trim()) { alert("Enter your name!"); return }
    const gameId = newGameId()
    const rewards = makeRewards()
    const layout = makeRandomLayout()

    const gamePayload: Partial<Game> & any = {
      status: "waiting",
      statusText: "Waiting host to start the game",
      round: 0,
      currentTile: 0,
      playersCount: 1,
      shuffleTurnUid: playerId,
      generateTurnIndex: 0,
      generateTurnUid: "",
      layout,
      rewards,
      templeWins: [],
      lastEvent: null,
    }

    await set(ref(db, `games/karuba/${gameId}`), gamePayload)
    await set(
      ref(db, `games/karuba/${gameId}/players/${playerId}`),
      createPlayerPayload(playerId, name.trim(), layout)
    )

    history.pushState({ playerName: name.trim() }, "", `/room/${gameId}`)
    dispatchEvent(new PopStateEvent("popstate"))
  }

  const joinGame = async () => {
    if (!name.trim()) { alert("Enter your name!"); return }
    const gameId = joinId.trim().toUpperCase()
    if (!gameId) { alert("Enter Game ID!"); return }

    const gSnap = await get(ref(db, `games/karuba/${gameId}`))
    if (!gSnap.exists()) { alert("Game not found!"); return }

    const layout: Layout = gSnap.val()?.layout
    const pSnap = await get(ref(db, `games/karuba/${gameId}/players/${playerId}`))
    if (!pSnap.exists()) {
      await set(
        ref(db, `games/karuba/${gameId}/players/${playerId}`),
        createPlayerPayload(playerId, name.trim(), layout)
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
              placeholder="Your name"
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
