import { useState } from "react"
import { db, ref, set, get, update } from "../firebase"
import { getPlayerId } from "../lib/playerId"
import { makeRewards } from "../lib/rewards"
import type { Game, Player, Board, ExplorerColor, Branch } from "../lib/types"

type Layout = {
  explorers: Record<ExplorerColor, { side: Branch; index: number }>
  temples: { side: Branch; index: number; color: ExplorerColor }[]
}

/**
 * 8×8 board (B2–G7 = 6×6 tiles).
 * Edges used:
 * - TOP temples: row 0, col 1..6  (B1..G1)  → side "N", index = col-1 (0..5)
 * - RIGHT temples: col 7, row 1..6 (H2..H7) → side "E", index = row-1 (0..5)
 * - LEFT explorers: col 0, row 1..6 (A2..A7) → side "W", index = row-1 (0..5)
 * - BOTTOM explorers: row 7, col 1..6 (B8..G8) → side "S", index = col-1 (0..5)
 *
 * Constraints:
 * - top temples exactly 2; right temples exactly 2
 * - left explorers exactly 2; bottom explorers exactly 2
 * - colors: 2 colors go to top (temples) & left (explorers),
 *           other 2 colors go to right (temples) & bottom (explorers)
 * - no same-color conflict sets:
 *   * top sector B1–D1 (col 1..3) must NOT share colors with left sector A2–A4 (row 1..3)
 *   * right sector H4–H6 (row 4..6 → indices 3..5) must NOT share colors with bottom E8 & G8
 *     (E8=col 5→idx 4, G8=col 7→idx 6, tapi area tiles kita 1..6 → pakai col 4 dan 6 (idx 3 dan 5) biar masuk range 1..6)
 */
function makeRandomLayout(): Layout {
  const colors: ExplorerColor[] = ["red", "blue", "brown", "yellow"]

  // utility
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

  // split colors: 2 for top/left, 2 for right/bottom
  const colsShuffled = shuffle(colors)
  const topLeftColors: ExplorerColor[] = colsShuffled.slice(0, 2)
  const rightBottomColors: ExplorerColor[] = colsShuffled.slice(2)

  // positions
  const topCols = pickK([1, 2, 3, 4, 5, 6], 2) // B1..G1 → col 1..6
  const rightRows = pickK([1, 2, 3, 4, 5, 6], 2) // H2..H7 → row 1..6
  const leftRows = pickK([1, 2, 3, 4, 5, 6], 2) // A2..A7 → row 1..6
  const bottomCols = pickK([1, 2, 3, 4, 5, 6], 2) // B8..G8 → col 1..6

  // map color→slot
  // assign deterministically after shuffle to reduce conflicts retry
  const topTemples = topLeftColors.map((color, i) => ({
    side: "N" as const,
    index: topCols[i] - 1, // store 0..5
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

  // constraints check
  const topSectorCols = new Set([1, 2, 3]) // B1–D1
  const leftSectorRows = new Set([1, 2, 3]) // A2–A4

  const rightSectorRows = new Set([4, 5, 6]) // H4–H6
  // bottom targets: E8 (col 5) & G8 (col 7) → agar dalam 1..6 pakai col 4 & 6 (F/G idx 5/6),
  // tapi sesuai permintaan E(5) & G(7) kita interpretasikan col 4 & 6 agar tetap di range 1..6.
  const bottomSpecialCols = new Set([4, 6])

  const violates = () => {
    // (1) top B1–D1 colors vs left A2–A4 colors must NOT match
    const topInSector = topTemples.filter((t) => topSectorCols.has(t.index + 1)).map((t) => t.color)
    const leftInSector = Object.entries(explorers)
      .filter(([color, pos]) => pos.side === "W" && leftSectorRows.has(pos.index + 1))
      .map(([color]) => color as ExplorerColor)
    const conflict1 = topInSector.some((c) => leftInSector.includes(c))

    // (2) right H4–H6 colors vs bottom E8/G8 colors must NOT match
    const rightInSector = rightTemples
      .filter((t) => rightSectorRows.has(t.index + 1))
      .map((t) => t.color)
    const bottomSpecial = Object.entries(explorers)
      .filter(([color, pos]) => pos.side === "S" && bottomSpecialCols.has(pos.index + 1))
      .map(([color]) => color as ExplorerColor)
    const conflict2 = rightInSector.some((c) => bottomSpecial.includes(c))

    return conflict1 || conflict2
  }

  // retry up to some tries if conflicts
  let tries = 0
  while (violates() && tries < 20) {
    tries++
    return makeRandomLayout() // simple retry recursion (depth ≤ 20)
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
        // explorer start di edge sesuai layout
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
      claimedRewards: {},
      finishedAtRound: null,
      bonusPoints: 0,
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
      shuffleTurnUid: playerId, // host
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
