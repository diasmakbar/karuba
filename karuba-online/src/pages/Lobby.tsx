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

  return { explorers, temples: [...topTemples, ...rightTemples] }
}

export default function Lobby() {
  const [step, setStep] = useState<"game" | "name">("game")
  const [gameId, setGameId] = useState("")
  const [name, setName] = useState("")
  const playerId = getPlayerId(name)

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
      // claimedRewards: {},
      claimedRewards: { red: {}, blue: {}, brown: {}, yellow: {} },
      finishedAtRound: null,
      bonusPoints: 0,
    } as unknown as Player
  }

  const newGameId = () => {
    const num = Math.floor(100000 + Math.random() * 900000).toString()
    return num.slice(0, 3) + " " + num.slice(3)
  }

  const handleCreateGame = async () => {
    const cleanId = gameId.replace(/\s/g, "")
    if (!name.trim()) return alert("Enter your name!")
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

    await set(ref(db, `games/karuba/${cleanId}`), gamePayload)
    await set(
      ref(db, `games/karuba/${cleanId}/players/${playerId}`),
      createPlayerPayload(playerId, name.trim(), layout)
    )

    history.pushState({ playerName: name.trim() }, "", `/room/${cleanId}`)
    dispatchEvent(new PopStateEvent("popstate"))
  }

  const handleJoinGame = async () => {
    const cleanId = gameId.replace(/\s/g, "")
    if (!name.trim()) return alert("Enter your name!")
    if (!/^\d{6}$/.test(cleanId)) return alert("Invalid Game ID")

    const gSnap = await get(ref(db, `games/karuba/${cleanId}`))
    if (!gSnap.exists()) return alert("Game not found!")

    const layout: Layout = gSnap.val()?.layout
    const pSnap = await get(ref(db, `games/karuba/${cleanId}/players/${playerId}`))
    if (!pSnap.exists()) {
      await set(
        ref(db, `games/karuba/${cleanId}/players/${playerId}`),
        createPlayerPayload(playerId, name.trim(), layout)
      )
      const playersSnap = await get(ref(db, `games/karuba/${cleanId}/players`))
      const count = playersSnap.exists() ? Object.keys(playersSnap.val() || {}).length : 1
      await update(ref(db, `games/karuba/${cleanId}`), { playersCount: count })
    }

    history.pushState({ playerName: name.trim() }, "", `/room/${cleanId}`)
    dispatchEvent(new PopStateEvent("popstate"))
  }

  return (
    <main className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div className="page-inner" style={{ width: 360 }}>
        <div className="card" style={{ padding: 24, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
          {step === "game" && (
            <div style={{ textAlign: "center" }}>
              <h2 className="font-display" style={{ marginBottom: 16 }}>Welcome to Karuba Online!</h2>
              <input
                placeholder="123 456"
                value={gameId}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, "").slice(0, 6)
                  if (val.length > 3) val = val.slice(0, 3) + " " + val.slice(3)
                  setGameId(val)
                }}
                style={{ width: "100%", padding: "8px 12px", marginBottom: 12, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }}
              />
              <button
                className="font-display"
                style={{ width: "100%", marginBottom: 12, padding: "10px", fontSize: 18, borderRadius: 6 }}
                onClick={() => {
                  if (/^\d{3}\s?\d{3}$/.test(gameId)) {
                    setStep("name")
                  } else {
                    alert("Game ID must be 6 digits")
                  }
                }}
              >
                Join Game!
              </button>
              <p style={{ marginTop: 12 }}>
                ... or create a{" "}
                <button
                  className="font-display"
                  style={{ padding: "4px 8px", fontSize: 16, borderRadius: 6 }}
                  onClick={() => {
                    setGameId(newGameId())
                    setStep("name")
                  }}
                >
                  New Game
                </button>
              </p>
            </div>
          )}

          {step === "name" && (
            <div style={{ textAlign: "center" }}>
              <h2 className="font-display" style={{ marginBottom: 16 }}>Please input your name:</h2>
              <input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", marginBottom: 12, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }}
              />
              <button
                className="font-display"
                style={{ width: "100%", padding: "10px", fontSize: 18, borderRadius: 6 }}
                onClick={async () => {
                  const cleanId = gameId.replace(/\s/g, "")
                  const gSnap = await get(ref(db, `games/karuba/${cleanId}`))
                  if (!gSnap.exists()) {
                    await handleCreateGame()
                  } else {
                    await handleJoinGame()
                  }
                }}
              >
                Join!
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
      }
