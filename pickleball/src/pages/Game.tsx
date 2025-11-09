import { useState, useEffect, useRef } from "react"
import { db, ref, onValue, update } from "../firebase"

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
  serverNumber: 1 | 2  // 1 or 2 for doubles, always 1 for singles
  serverSide: 'left' | 'right'  // Court side based on serving team's score parity
  maxScore: number
  currentGame: number
  games: any[]
  matchWinner: string | null
}

export default function Game({ gameId, isDarkMode, onToggleTheme }: { gameId: string; isDarkMode: boolean; onToggleTheme: () => void }) {
  const [game, setGame] = useState<Game | null>(null)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const speechSynthRef = useRef<SpeechSynthesis | null>(null)

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

  useEffect(() => {
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthRef.current = window.speechSynthesis
    }
  }, [])

  const speak = (text: string) => {
    if (!voiceEnabled || !speechSynthRef.current) return

    const utterance = new SpeechSynthesisUtterance(text)
    speechSynthRef.current.speak(utterance)
  }

  const rallyWon = async (teamId: string) => {
    if (!game || game.currentServer !== teamId) return

    const servingTeam = game.currentServer!
    const servingTeamScore = game.teams[servingTeam as keyof typeof game.teams].score
    const newScore = servingTeamScore + 1

    // Check for win condition
    const opponentTeam = servingTeam === "team1" ? "team2" : "team1"
    const opponentScore = game.teams[opponentTeam as keyof typeof game.teams].score
    const hasWon = newScore >= game.maxScore && (newScore - opponentScore >= 2 || newScore >= game.maxScore + 1)

    if (hasWon) {
      speak(`${game.teams[servingTeam as keyof typeof game.teams].name} wins the game!`)

      // Save completed game result
      const completedGame = {
        gameNumber: game.currentGame,
        winner: servingTeam,
        score: {
          team1: servingTeam === "team1" ? newScore : game.teams.team1.score,
          team2: servingTeam === "team2" ? newScore : game.teams.team2.score
        },
        completedAt: Date.now()
      }

      const updatedGames = [...(game.games || []), completedGame]

      // Calculate match winner based on match format
      let matchWinner = null
      const team1Wins = updatedGames.filter(g => g.winner === "team1").length
      const team2Wins = updatedGames.filter(g => g.winner === "team2").length

      const requiredWins = game.matchFormat === 'bo1' ? 1 :
                          game.matchFormat === 'bo3' ? 2 : 3

      if (team1Wins >= requiredWins) {
        matchWinner = "team1"
        speak(`${game.teams.team1.name} wins the match!`)
      } else if (team2Wins >= requiredWins) {
        matchWinner = "team2"
        speak(`${game.teams.team2.name} wins the match!`)
      }

      if (matchWinner) {
        // Match is complete
        await update(ref(db, `games/pickle/${gameId}`), {
          [`teams/${servingTeam}/score`]: newScore,
          status: "match_finished",
          winner: servingTeam,
          games: updatedGames,
          matchWinner,
          finishedAt: Date.now()
        })
      } else {
        // Continue to next game automatically
        const nextGame = game.currentGame + 1
        speak(`Game ${game.currentGame} complete. Starting game ${nextGame}.`)

        await update(ref(db, `games/pickle/${gameId}`), {
          [`teams/${servingTeam}/score`]: newScore,
          status: "playing",
          winner: servingTeam,
          games: updatedGames,
          currentGame: nextGame,
          // Reset for next game
          "teams/team1/score": 0,
          "teams/team2/score": 0,
          currentServer: nextGame % 2 === 1 ? "team1" : "team2",
          serverNumber: 2 // Always start with server 2
        })
      }
      return
    }

    // Serving team scores - they keep serving, court side changes based on new score parity
    const newServerSide = newScore % 2 === 0 ? "right" : "left"

    await update(ref(db, `games/pickle/${gameId}`), {
      [`teams/${servingTeam}/score`]: newScore,
      serverSide: newServerSide
    })

    speak(`${newScore} - ${opponentScore}`)
  }

  const rallyLost = async (teamId: string) => {
    if (!game || game.currentServer !== teamId) return

    const servingTeam = game.currentServer!
    let newServer = servingTeam
    let newServerNumber = game.serverNumber

    if (game.gameMode === 'doubles') {
      if (game.serverNumber === 1) {
        // Switch to server 2 on same team
        newServerNumber = 2
      } else {
        // Switch to other team, start with server 1
        newServer = servingTeam === "team1" ? "team2" : "team1"
        newServerNumber = 1
        speak(`${game.teams[newServer as keyof typeof game.teams].name} to serve`)
      }
    } else {
      // Singles - just switch to other team
      newServer = servingTeam === "team1" ? "team2" : "team1"
      speak(`${game.teams[newServer as keyof typeof game.teams].name} to serve`)
    }

    // Court side is determined by current serving team's score parity
    const servingTeamScore = game.teams[newServer as keyof typeof game.teams].score
    const newServerSide = servingTeamScore % 2 === 0 ? "right" : "left"

    await update(ref(db, `games/pickle/${gameId}`), {
      currentServer: newServer,
      serverNumber: newServerNumber,
      serverSide: newServerSide
    })
  }

  const resetGame = async () => {
    if (!game) return

    await update(ref(db, `games/pickle/${gameId}`), {
      "teams/team1/score": 0,
      "teams/team2/score": 0,
      currentServer: "team1",
      serverNumber: 2,
      serverSide: "right",
      status: "playing",
      currentGame: 1,
      games: [],
      matchWinner: null
    })
  }

  const continueToNextGame = async () => {
    if (!game) return

    await update(ref(db, `games/pickle/${gameId}`), {
      status: "playing"
    })
  }

  if (!game) {
    return (
      <main className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div>Loading game...</div>
      </main>
    )
  }

  const team1Players = game.teams.team1.players.map(id => game.players[id]).filter(Boolean)
  const team2Players = game.teams.team2.players.map(id => game.players[id]).filter(Boolean)

  return (
    <main className="page" style={{ padding: "20px" }}>
      <div className="page-inner" style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Header */}
        <div className="card" style={{ padding: 20, marginBottom: 20, textAlign: "center" }}>
          <h1 style={{ margin: "0 0 10px 0" }} className="font-display">
            {game.name}
          </h1>
          <div style={{ marginBottom: "15px" }}>
            <div style={{ fontSize: "16px", color: "var(--text-black)" }}>
              {game.gameMode === 'singles' ? 'Singles' : 'Doubles'} • {game.matchFormat.toUpperCase()}
            </div>
            <div style={{ fontSize: "14px", color: "var(--text-black)" }}>
              Game {game.currentGame} of {game.matchFormat === 'bo1' ? 1 : game.matchFormat === 'bo3' ? 3 : 5}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
              />
              Voice
            </label>
            <button
              onClick={resetGame}
              style={{
                padding: "6px 12px",
                background: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              Reset Game
            </button>
            <button
              onClick={onToggleTheme}
              style={{
                padding: "6px 12px",
                background: isDarkMode ? "#333" : "#f8f9fa",
                color: isDarkMode ? "white" : "#333",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              {isDarkMode ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>
        </div>

        {/* Match Progress */}
        {game.games && game.games.length > 0 && (
          <div className="card" style={{ padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 15px 0", textAlign: "center" }}>Match Progress</h3>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
              {Array.from({ length: game.matchFormat === 'bo1' ? 1 : game.matchFormat === 'bo3' ? 3 : 5 }, (_, i) => {
                const gameResult = game.games.find(g => g.gameNumber === i + 1)
                return (
                  <div
                    key={i + 1}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      background: gameResult
                        ? gameResult.winner === "team1"
                          ? "#007bff"
                          : "#28a745"
                        : game.currentGame === i + 1
                        ? "#fff3cd"
                        : "#f8f9fa",
                      color: gameResult ? "white" : game.currentGame === i + 1 ? "#856404" : "#666",
                      minWidth: "60px",
                      textAlign: "center",
                      fontWeight: "bold"
                    }}
                  >
                    Game {i + 1}<br/>
                    {gameResult ? `${gameResult.score.team1}-${gameResult.score.team2}` : "Not played"}
                  </div>
                )
              })}
            </div>
            <div style={{ textAlign: "center", marginTop: "15px" }}>
              <div style={{ fontSize: "16px", fontWeight: "bold" }}>
                {game.teams.team1.name}: {game.games.filter(g => g.winner === "team1").length} wins
              </div>
              <div style={{ fontSize: "16px", fontWeight: "bold" }}>
                {game.teams.team2.name}: {game.games.filter(g => g.winner === "team2").length} wins
              </div>
            </div>
          </div>
        )}

        {/* Score Display */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: 30 }}>
          {/* Team 1 */}
          <div style={{
            padding: "30px",
            border: `3px solid ${game.currentServer === "team1" ? "#007bff" : "#ddd"}`,
            borderRadius: "12px",
            background: "transparent",
            textAlign: "center",
            position: "relative"
          }}>
            {game.currentServer === "team1" && (
              <div style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "#007bff",
                color: "white",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "bold"
              }}>
                SERVING
              </div>
            )}
            <h2 style={{ margin: "0 0 15px 0", color: "#007bff" }}>
              {game.teams.team1.name}
            </h2>
            <div style={{ fontSize: "48px", fontWeight: "bold", marginBottom: "15px", color: "#007bff" }}>
              {game.teams.team1.score}
            </div>
            <div style={{ fontSize: "14px", color: "#007bff", marginBottom: "20px" }}>
              {team1Players.map(p => p.name).join(", ")}
            </div>
            {game.status !== "finished" && game.status !== "match_finished" && (
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => rallyWon("team1")}
                  disabled={game.currentServer !== "team1"}
                  style={{
                    flex: 1,
                    padding: "15px",
                    background: game.currentServer === "team1" ? "#28a745" : "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: game.currentServer === "team1" ? "pointer" : "not-allowed",
                    opacity: game.currentServer === "team1" ? 1 : 0.5
                  }}
                >
                  IN
                </button>
                <button
                  onClick={() => rallyLost("team1")}
                  disabled={game.currentServer !== "team1"}
                  style={{
                    flex: 1,
                    padding: "15px",
                    background: game.currentServer === "team1" ? "#dc3545" : "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: game.currentServer === "team1" ? "pointer" : "not-allowed",
                    opacity: game.currentServer === "team1" ? 1 : 0.5
                  }}
                >
                  OUT
                </button>
              </div>
            )}
          </div>

          {/* Team 2 */}
          <div style={{
            padding: "30px",
            border: `3px solid ${game.currentServer === "team2" ? "#28a745" : "#ddd"}`,
            borderRadius: "12px",
            background: "transparent",
            textAlign: "center",
            position: "relative"
          }}>
            {game.currentServer === "team2" && (
              <div style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "#28a745",
                color: "white",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "bold"
              }}>
                SERVING
              </div>
            )}
            <h2 style={{ margin: "0 0 15px 0", color: "#28a745" }}>
              {game.teams.team2.name}
            </h2>
            <div style={{ fontSize: "48px", fontWeight: "bold", marginBottom: "15px", color: "#28a745" }}>
              {game.teams.team2.score}
            </div>
            <div style={{ fontSize: "14px", color: "#28a745", marginBottom: "20px" }}>
              {team2Players.map(p => p.name).join(", ")}
            </div>
            {game.status !== "finished" && game.status !== "match_finished" && (
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => rallyWon("team2")}
                  disabled={game.currentServer !== "team2"}
                  style={{
                    flex: 1,
                    padding: "15px",
                    background: game.currentServer === "team2" ? "#28a745" : "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: game.currentServer === "team2" ? "pointer" : "not-allowed",
                    opacity: game.currentServer === "team2" ? 1 : 0.5
                  }}
                >
                  IN
                </button>
                <button
                  onClick={() => rallyLost("team2")}
                  disabled={game.currentServer !== "team2"}
                  style={{
                    flex: 1,
                    padding: "15px",
                    background: game.currentServer === "team2" ? "#dc3545" : "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: game.currentServer === "team2" ? "pointer" : "not-allowed",
                    opacity: game.currentServer === "team2" ? 1 : 0.5
                  }}
                >
                  OUT
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Game Status */}
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 15px 0", textAlign: "center" }}>Game Status</h3>

          {/* Score Display */}
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "5px" }}>
              {game.teams.team1.score} - {game.teams.team2.score}
            </div>
            <div style={{ color: "var(--text-black)", fontSize: "14px" }}>
              First to {game.maxScore} points{game.matchFormat === 'bo1' ? '' : game.matchFormat === 'bo3' ? ' (win by 2)' : ' (win by 3)'} • {Math.max(0, game.maxScore - Math.max(game.teams.team1.score, game.teams.team2.score))} to win
            </div>
          </div>

          {/* Serve Information */}
          <div style={{ marginBottom: "20px", padding: "15px", background: "transparent", borderRadius: "8px" }}>
            <h4 style={{ margin: "0 0 10px 0", textAlign: "center", color: "var(--text-black)" }}>Serve Information</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "14px", color: "var(--text-black)", marginBottom: "5px" }}>Serving Team</div>
                <div style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: game.currentServer === "team1" ? "#007bff" : "#28a745"
                }}>
                  {game.currentServer ? game.teams[game.currentServer as keyof typeof game.teams].name : "None"}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "14px", color: "var(--text-black)", marginBottom: "5px" }}>Server</div>
                <div style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: game.currentServer === "team1" ? "#007bff" : "#28a745"
                }}>
                  {game.currentServer && game.gameMode === 'doubles'
                    ? game.teams[game.currentServer as keyof typeof game.teams].players[game.serverNumber - 1]
                      ? game.players[game.teams[game.currentServer as keyof typeof game.teams].players[game.serverNumber - 1]]?.name
                      : `Server ${game.serverNumber}`
                    : game.currentServer
                    ? game.teams[game.currentServer as keyof typeof game.teams].players[0]
                      ? game.players[game.teams[game.currentServer as keyof typeof game.teams].players[0]]?.name
                      : "Player"
                    : "None"
                  }
                </div>
              </div>
            </div>

            {/* Serve Direction Indicator */}
            <div style={{ textAlign: "center", marginTop: "15px" }}>
              <div style={{ fontSize: "14px", color: "var(--text-black)", marginBottom: "10px" }}>Serve Direction</div>
              <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
                <div style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  background: game.serverSide === "left" ? (game.currentServer === "team1" ? "#007bff" : "#28a745") : "#e9ecef",
                  color: game.serverSide === "left" ? "white" : "#666",
                  fontWeight: "bold",
                  border: game.serverSide === "left" ? `2px solid ${game.currentServer === "team1" ? "#0056b3" : "#1e7e34"}` : "2px solid #dee2e6"
                }}>
                  ← Left Side
                </div>
                <div style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  background: game.serverSide === "right" ? (game.currentServer === "team1" ? "#007bff" : "#28a745") : "#e9ecef",
                  color: game.serverSide === "right" ? "white" : "#666",
                  fontWeight: "bold",
                  border: game.serverSide === "right" ? `2px solid ${game.currentServer === "team1" ? "#0056b3" : "#1e7e34"}` : "2px solid #dee2e6"
                }}>
                  Right Side →
                </div>
              </div>
            </div>
          </div>

          {/* Game Progress */}
          <div style={{ textAlign: "center" }}>
            {game.teams.team1.score >= 10 && game.teams.team2.score >= 10 && (
              <div style={{
                padding: "8px",
                background: "#fff3cd",
                color: "#856404",
                borderRadius: "4px",
                fontSize: "14px"
              }}>
                ⚠️ Game point! Must win by 2 points.
              </div>
            )}
          </div>

          {game.status === "waiting_next_game" && (
            <div style={{
              marginTop: "20px",
              padding: "20px",
              background: "#e3f2fd",
              color: "#0d47a1",
              borderRadius: "8px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "20px", marginBottom: "10px" }}>🏓 Game {game.currentGame - 1} Complete!</div>
              <div style={{ fontSize: "16px", marginBottom: "15px" }}>
                {game.teams[(game as any).winner as keyof typeof game.teams]?.name} won Game {game.currentGame - 1}
              </div>
              <button
                onClick={continueToNextGame}
                style={{
                  padding: "12px 24px",
                  background: "#1976d2",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                Start Game {game.currentGame}
              </button>
            </div>
          )}

          {game.status === "finished" && (
            <div style={{
              marginTop: "20px",
              padding: "20px",
              background: "#d4edda",
              color: "#155724",
              borderRadius: "8px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "24px", marginBottom: "10px" }}>🎉 Game Over! 🎉</div>
              <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                {game.teams[(game as any).winner as keyof typeof game.teams]?.name} Wins!
              </div>
              <div style={{ fontSize: "14px", marginTop: "10px", opacity: 0.8 }}>
                Final Score: {game.teams.team1.score} - {game.teams.team2.score}
              </div>
            </div>
          )}

          {game.status === "match_finished" && (
            <div style={{
              marginTop: "20px",
              padding: "20px",
              background: "var(--bg-secondary)",
              border: "2px solid var(--green)",
              borderRadius: "8px",
              textAlign: "center",
              color: "var(--text-primary)"
            }}>
              <div style={{ fontSize: "28px", marginBottom: "10px", color: "var(--text-primary)" }}>🏆 Match Complete! 🏆</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "15px", color: "var(--text-primary)" }}>
                {game.teams[game.matchWinner as keyof typeof game.teams]?.name} Wins the Match!
              </div>
              <div style={{ fontSize: "16px", marginBottom: "10px", color: "var(--text-primary)" }}>
                Final Score: {game.games.filter(g => g.winner === "team1").length} - {game.games.filter(g => g.winner === "team2").length}
              </div>
              <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                Match Format: {game.matchFormat.toUpperCase()} ({game.gameMode})
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={() => {
              window.history.pushState({}, "", "/")
              window.dispatchEvent(new PopStateEvent("popstate"))
            }}
            style={{
              padding: "10px 20px",
              background: "transparent",
              color: "var(--text-black)",
              border: "1px solid #ddd",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </main>
  )
}
