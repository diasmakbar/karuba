import { useState, useEffect } from "react"
import { db, ref, onValue } from "../firebase"

interface Game {
  id: string
  name: string
  status: string
  createdAt: number
  players: Record<string, any>
}

export default function JoinGame() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [joiningGameId, setJoiningGameId] = useState<string | null>(null)

  useEffect(() => {
    const gamesRef = ref(db, "games/pickle")
    const unsubscribe = onValue(gamesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const gamesList = Object.values(data) as Game[]
        // Filter to only show waiting games and sort by creation time
        const availableGames = gamesList
          .filter(game => game.status === "waiting")
          .sort((a, b) => b.createdAt - a.createdAt)
        setGames(availableGames)
      } else {
        setGames([])
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const joinGame = async (gameId: string) => {
    setJoiningGameId(gameId)
    try {
      // Navigate to setup page
      window.history.pushState({ gameId }, "", `/setup/${gameId}`)
      window.dispatchEvent(new PopStateEvent("popstate"))
    } catch (error) {
      console.error("Error joining game:", error)
      alert("Failed to join game. Please try again.")
    } finally {
      setJoiningGameId(null)
    }
  }

  return (
    <main className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "20px" }}>
      <div className="page-inner" style={{
        width: "100%",
        maxWidth: 600,
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <div className="card" style={{
          padding: 24,
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          width: "100%"
        }}>
          <h2 style={{ margin: "0 0 20px 0", textAlign: "center" }} className="font-display">
            Join Pickleball Game
          </h2>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div>Loading available games...</div>
            </div>
          ) : games.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              <div>No games available to join right now.</div>
              <div style={{ marginTop: "10px", fontSize: "14px" }}>
                Create a new game to get started!
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {games.map((game) => (
                <div
                  key={game.id}
                  style={{
                    padding: "16px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#fafafa"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: "4px" }}>
                      {game.name}
                    </div>
                    <div style={{ fontSize: "14px", color: "#666" }}>
                      Created {new Date(game.createdAt).toLocaleString()}
                    </div>
                    <div style={{ fontSize: "14px", color: "#666" }}>
                      Players: {Object.keys(game.players || {}).length}
                    </div>
                  </div>
                  <button
                    onClick={() => joinGame(game.id)}
                    disabled={joiningGameId === game.id}
                    style={{
                      padding: "8px 16px",
                      background: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: joiningGameId === game.id ? "not-allowed" : "pointer",
                      opacity: joiningGameId === game.id ? 0.6 : 1
                    }}
                  >
                    {joiningGameId === game.id ? "Joining..." : "Join Game"}
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              window.history.pushState({}, "", "/")
              window.dispatchEvent(new PopStateEvent("popstate"))
            }}
            style={{
              width: "100%",
              padding: "10px",
              background: "transparent",
              color: "#666",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              cursor: "pointer",
              marginTop: "20px"
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </main>
  )
}
