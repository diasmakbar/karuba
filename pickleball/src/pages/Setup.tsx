import { useState, useEffect } from "react"
import { db, ref, onValue, update, push, set, auth } from "../firebase"

interface Game {
  id: string
  name: string
  gameMode: 'singles' | 'doubles'
  matchFormat: 'bo1' | 'bo3' | 'bo5'
  status: string
  teams: {
    team1: { name: string; players: string[]; score: number }
    team2: { name: string; players: string[]; score: number }
  }
  players: Record<string, { id: string; name: string; team?: string }>
  currentServer: string | null
  gameStarted: boolean
  currentGame: number
  games: any[]
  matchWinner: string | null
}

interface Player {
  id: string
  name: string
  team?: string
}

export default function Setup({ gameId }: { gameId: string }) {
  const [game, setGame] = useState<Game | null>(null)
  const [playerName, setPlayerName] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null)

  useEffect(() => {
    const gameRef = ref(db, `games/pickle/${gameId}`)
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        // Ensure teams structure is properly initialized
        const gameData = {
          ...data,
          teams: {
            team1: {
              name: data.teams?.team1?.name || "Team 1",
              players: data.teams?.team1?.players || [],
              score: data.teams?.team1?.score || 0
            },
            team2: {
              name: data.teams?.team2?.name || "Team 2",
              players: data.teams?.team2?.players || [],
              score: data.teams?.team2?.score || 0
            }
          },
          players: data.players || {}
        }
        setGame(gameData)
      }
    })

    return () => unsubscribe()
  }, [gameId])

  const joinGame = async () => {
    if (!playerName.trim() || !game) return

    setIsJoining(true)
    try {
      const playerId = push(ref(db, `games/pickle/${gameId}/players`)).key!
      const uid = auth.currentUser?.uid
      if (!uid) {
        alert('Authentication not ready. Please try again.')
        return
      }

      const playerData = {
        id: playerId,
        name: playerName.trim(),
        joinedAt: Date.now()
      }

      // Set player data and add to owners (required by Firebase rules)
      await update(ref(db, `games/pickle/${gameId}`), {
        [`players/${playerId}`]: playerData,
        [`owners/${uid}`]: true
      })
      setCurrentPlayerId(playerId)
    } catch (error) {
      console.error("Error joining game:", error)
      alert("Failed to join game. Please try again.")
    } finally {
      setIsJoining(false)
    }
  }

  const joinTeam = async (teamId: string) => {
    if (!currentPlayerId || !game) return

    const maxPlayers = game.gameMode === 'singles' ? 1 : 2
    const currentTeamPlayers = game.teams[teamId as keyof typeof game.teams].players.length

    if (currentTeamPlayers >= maxPlayers) {
      alert(`This team already has the maximum number of players (${maxPlayers}) for ${game.gameMode} mode.`)
      return
    }

    try {
      // Remove from current team if already in one
      const currentTeam = game.players[currentPlayerId]?.team
      if (currentTeam && currentTeam !== teamId) {
        const currentTeamPlayers = game.teams[currentTeam as keyof typeof game.teams].players.filter(id => id !== currentPlayerId)
        await set(ref(db, `games/pickle/${gameId}/teams/${currentTeam}/players`), currentTeamPlayers)
      }

      // Add to new team
      const teamPlayers = [...(game.teams[teamId as keyof typeof game.teams].players || []), currentPlayerId]
      await set(ref(db, `games/pickle/${gameId}/teams/${teamId}/players`), teamPlayers)
      await update(ref(db, `games/pickle/${gameId}/players/${currentPlayerId}`), { team: teamId })
    } catch (error) {
      console.error("Error joining team:", error)
    }
  }

  const startGame = async () => {
    if (!game) return

    const team1Players = game.teams.team1.players.length
    const team2Players = game.teams.team2.players.length

    if (team1Players === 0 || team2Players === 0) {
      alert("Both teams need at least one player to start the game.")
      return
    }

    try {
      // Set initial server (team1 serves first with server 2 from right side)
      await update(ref(db, `games/pickle/${gameId}`), {
        status: "playing",
        gameStarted: true,
        currentServer: "team1",
        serverNumber: 2, // Always start with server 2
        serverSide: "right", // Right side for even scores (0 is even)
        maxScore: 11 // Default to 11 points to win
      })

      // Navigate to game page
      window.history.pushState({ gameId }, "", `/game/${gameId}`)
      window.dispatchEvent(new PopStateEvent("popstate"))
    } catch (error) {
      console.error("Error starting game:", error)
    }
  }

  if (!game) {
    return (
      <main className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div>Loading game...</div>
      </main>
    )
  }

  const players = Object.values(game.players || {}) as Player[]
  const currentPlayer = currentPlayerId ? game.players[currentPlayerId] : null

  return (
    <main className="page" style={{ padding: "20px" }}>
      <div className="page-inner" style={{ maxWidth: 800, margin: "0 auto" }}>
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h2 style={{ margin: "0 0 20px 0", textAlign: "center" }} className="font-display">
            {game.name} - Game Setup
          </h2>

          {!currentPlayerId ? (
            <div style={{ marginBottom: 30 }}>
              <h3>Join the Game</h3>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "16px"
                  }}
                  onKeyPress={(e) => e.key === "Enter" && joinGame()}
                />
                <button
                  onClick={joinGame}
                  disabled={!playerName.trim() || isJoining}
                  style={{
                    padding: "12px 24px",
                    background: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "16px",
                    cursor: (!playerName.trim() || isJoining) ? "not-allowed" : "pointer",
                    opacity: (!playerName.trim() || isJoining) ? 0.6 : 1
                  }}
                >
                  {isJoining ? "Joining..." : "Join Game"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 30 }}>
              <h3>Welcome, {currentPlayer?.name}!</h3>
              <p>Choose your team below.</p>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: 30 }}>
            {/* Team 1 */}
            <div style={{
              padding: "20px",
              border: "2px solid #007bff",
              borderRadius: "8px",
              background: "#f8f9ff"
            }}>
              <h3 style={{ margin: "0 0 15px 0", color: "#007bff" }}>
                {game.teams.team1.name}
              </h3>
              <div style={{ marginBottom: "15px", minHeight: "60px" }}>
                {game.teams.team1.players.map(playerId => {
                  const player = game.players[playerId]
                  return player ? (
                    <div key={playerId} style={{ padding: "4px 0", fontSize: "14px" }}>
                      {player.name}
                    </div>
                  ) : null
                })}
                {game.teams.team1.players.length === 0 && (
                  <div style={{ color: "#999", fontStyle: "italic" }}>No players yet</div>
                )}
              </div>
              {currentPlayerId && !game.teams.team1.players.includes(currentPlayerId) && (
                <button
                  onClick={() => joinTeam("team1")}
                  style={{
                    width: "100%",
                    padding: "8px",
                    background: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Join Team 1
                </button>
              )}
            </div>

            {/* Team 2 */}
            <div style={{
              padding: "20px",
              border: "2px solid #28a745",
              borderRadius: "8px",
              background: "#f8fff8"
            }}>
              <h3 style={{ margin: "0 0 15px 0", color: "#28a745" }}>
                {game.teams.team2.name}
              </h3>
              <div style={{ marginBottom: "15px", minHeight: "60px" }}>
                {game.teams.team2.players.map(playerId => {
                  const player = game.players[playerId]
                  return player ? (
                    <div key={playerId} style={{ padding: "4px 0", fontSize: "14px" }}>
                      {player.name}
                    </div>
                  ) : null
                })}
                {game.teams.team2.players.length === 0 && (
                  <div style={{ color: "#999", fontStyle: "italic" }}>No players yet</div>
                )}
              </div>
              {currentPlayerId && !game.teams.team2.players.includes(currentPlayerId) && (
                <button
                  onClick={() => joinTeam("team2")}
                  style={{
                    width: "100%",
                    padding: "8px",
                    background: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Join Team 2
                </button>
              )}
            </div>
          </div>

          {/* Start Game Button */}
          <div style={{ textAlign: "center" }}>
            <button
              onClick={startGame}
              disabled={!currentPlayerId || game.teams.team1.players.length === 0 || game.teams.team2.players.length === 0}
              style={{
                padding: "12px 32px",
                background: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "18px",
                fontWeight: 500,
                cursor: (!currentPlayerId || game.teams.team1.players.length === 0 || game.teams.team2.players.length === 0) ? "not-allowed" : "pointer",
                opacity: (!currentPlayerId || game.teams.team1.players.length === 0 || game.teams.team2.players.length === 0) ? 0.6 : 1
              }}
            >
              Start Game
            </button>
          </div>
        </div>

        {/* All Players List */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ margin: "0 0 15px 0" }}>All Players ({players.length})</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {players.map(player => (
              <span
                key={player.id}
                style={{
                  padding: "4px 8px",
                  background: player.team === "team1" ? "#007bff" : player.team === "team2" ? "#28a745" : "#6c757d",
                  color: "white",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              >
                {player.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
