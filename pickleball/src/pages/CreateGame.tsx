import { useState } from "react"
import { db, push, ref, update, auth } from "../firebase"

type GameMode = 'singles' | 'doubles'
type MatchFormat = 'bo1' | 'bo3' | 'bo5'

export default function CreateGame({ isDarkMode, onToggleTheme }: { isDarkMode: boolean; onToggleTheme: () => void }) {
  const [gameName, setGameName] = useState("")
  const [gameMode, setGameMode] = useState<GameMode>('doubles')
  const [matchFormat, setMatchFormat] = useState<MatchFormat>('bo1')
  const [isCreating, setIsCreating] = useState(false)

  const createGame = async () => {
    if (!gameName.trim()) return

    setIsCreating(true)
    try {
      const gameId = push(ref(db, "games/pickle")).key!
      const uid = auth.currentUser?.uid
      if (!uid) {
        alert('Authentication not ready. Please try again.')
        return
      }

      // Create the game data
      const gameData = {
        id: gameId,
        name: gameName.trim(),
        gameMode,
        matchFormat,
        status: "waiting",
        createdAt: Date.now(),
        players: {},
        teams: {
          team1: { name: "Team 1", players: [], score: 0 },
          team2: { name: "Team 2", players: [], score: 0 }
        },
        currentServer: null,
        gameStarted: false,
        currentGame: 1,
        games: [],
        matchWinner: null
      }

      // Set game data and owners field (required by Firebase rules)
      await update(ref(db, `games/pickle/${gameId}`), {
        ...gameData,
        [`owners/${uid}`]: true
      })

      // Navigate to setup page
      window.history.pushState({ gameId }, "", `/setup/${gameId}`)
      window.dispatchEvent(new PopStateEvent("popstate"))
    } catch (error) {
      console.error("Error creating game:", error)
      alert("Failed to create game. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <main className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div className="page-inner" style={{
        width: 360,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ position: "absolute", top: "20px", right: "20px" }}>
          <button
            onClick={onToggleTheme}
            style={{
              padding: "8px 12px",
              background: isDarkMode ? "#333" : "#f8f9fa",
              color: isDarkMode ? "white" : "#333",
              border: "1px solid #ddd",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            {isDarkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>

        <div className="card" style={{
          padding: 24,
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          width: "100%"
        }}>
          <h2 style={{ margin: "0 0 20px 0", textAlign: "center" }} className="font-display">
            Create Pickleball Game
          </h2>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              Game Name
            </label>
            <input
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="Enter game name"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "16px",
                boxSizing: "border-box"
              }}
              onKeyPress={(e) => e.key === "Enter" && createGame()}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              Game Mode
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setGameMode('singles')}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: `2px solid ${gameMode === 'singles' ? '#007bff' : '#ddd'}`,
                  borderRadius: "6px",
                  background: gameMode === 'singles' ? '#f8f9ff' : 'white',
                  color: gameMode === 'singles' ? '#007bff' : '#666',
                  fontWeight: gameMode === 'singles' ? 'bold' : 'normal',
                  cursor: 'pointer'
                }}
              >
                Singles<br/>
                <small style={{ fontSize: '12px', fontWeight: 'normal' }}>1 player per team</small>
              </button>
              <button
                type="button"
                onClick={() => setGameMode('doubles')}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: `2px solid ${gameMode === 'doubles' ? '#007bff' : '#ddd'}`,
                  borderRadius: "6px",
                  background: gameMode === 'doubles' ? '#f8f9ff' : 'white',
                  color: gameMode === 'doubles' ? '#007bff' : '#666',
                  fontWeight: gameMode === 'doubles' ? 'bold' : 'normal',
                  cursor: 'pointer'
                }}
              >
                Doubles<br/>
                <small style={{ fontSize: '12px', fontWeight: 'normal' }}>Max 2 players per team</small>
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              Match Format
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[
                { value: 'bo1' as MatchFormat, label: 'BO1', desc: 'Single game' },
                { value: 'bo3' as MatchFormat, label: 'BO3', desc: 'Best of 3' },
                { value: 'bo5' as MatchFormat, label: 'BO5', desc: 'Best of 5' }
              ].map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMatchFormat(value)}
                  style={{
                    flex: '1 1 30%',
                    padding: "10px",
                    border: `2px solid ${matchFormat === value ? '#28a745' : '#ddd'}`,
                    borderRadius: "6px",
                    background: matchFormat === value ? '#f8fff8' : 'white',
                    color: matchFormat === value ? '#28a745' : '#666',
                    fontWeight: matchFormat === value ? 'bold' : 'normal',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {label}<br/>
                  <small style={{ fontSize: '11px', fontWeight: 'normal' }}>{desc}</small>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={createGame}
            disabled={!gameName.trim() || isCreating}
            style={{
              width: "100%",
              padding: "12px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: 500,
              cursor: (!gameName.trim() || isCreating) ? "not-allowed" : "pointer",
              opacity: (!gameName.trim() || isCreating) ? 0.6 : 1
            }}
          >
            {isCreating ? "Creating..." : "Create Game"}
          </button>

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
              marginTop: "12px"
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </main>
  )
}
