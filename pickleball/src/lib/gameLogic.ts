import { db, ref, update } from "../firebase"

export interface GameState {
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
  court: { p1: string; p2: string; p3: string; p4: string }
  currentServer: string | null
  gameStarted: boolean
  serverNumber: 1 | 2
  serverSide: 'L' | 'R'
  maxScore: number
  currentGame: number
  games: any[]
  winner?: string | null
  matchWinner: string | null
}

export interface ServeInfo {
  serverName: string
  receiverName: string
  serverSide: 'L' | 'R'
  serverTeam: string
  receiverTeam: string
}

/**
 * Get current serve information
 */
export function getServeInfo(game: GameState): ServeInfo {
  if (!game.currentServer) {
    return {
      serverName: "Unknown",
      receiverName: "Unknown",
      serverSide: "R",
      serverTeam: "",
      receiverTeam: ""
    }
  }

  const serverTeam = game.currentServer
  const receiverTeam = serverTeam === "team1" ? "team2" : "team1"

  // Find server name
  const serverName = game.gameMode === 'doubles'
    ? game.teams[serverTeam as keyof typeof game.teams].players[game.serverNumber - 1]
      ? game.players[game.teams[serverTeam as keyof typeof game.teams].players[game.serverNumber - 1]]?.name
      : `Server ${game.serverNumber}`
    : game.teams[serverTeam as keyof typeof game.teams].players[0]
    ? game.players[game.teams[serverTeam as keyof typeof game.teams].players[0]]?.name
    : "Player"

  // Find receiver based on server position and side
  let receiverPlayerId = ""
  if (serverTeam === "team1") {
    const serverPos = game.court.p1 === game.teams.team1.players[game.serverNumber - 1] ? "p1" : "p2"
    if (serverPos === "p1") {
      receiverPlayerId = game.serverSide === "R" ? game.court.p3 : game.court.p4
    } else {
      receiverPlayerId = game.serverSide === "R" ? game.court.p3 : game.court.p4
    }
  } else {
    const serverPos = game.court.p3 === game.teams.team2.players[game.serverNumber - 1] ? "p3" : "p4"
    if (serverPos === "p3") {
      receiverPlayerId = game.serverSide === "R" ? game.court.p1 : game.court.p2
    } else {
      receiverPlayerId = game.serverSide === "R" ? game.court.p1 : game.court.p2
    }
  }

  const receiverName = game.players[receiverPlayerId]?.name || "Player"

  return {
    serverName,
    receiverName,
    serverSide: game.serverSide,
    serverTeam,
    receiverTeam
  }
}

/**
 * Switch serve to the next server
 */
export function switchServe(game: GameState): Partial<GameState> {
  if (!game.currentServer) return {}

  const servingTeam = game.currentServer
  let newServer = servingTeam
  let newServerNumber = game.serverNumber

  if (game.gameMode === 'doubles') {
    if (game.serverNumber === 1) {
      // Server #1 lost → switch to Server #2 (same team)
      newServerNumber = 2
    } else {
      // Server #2 lost → side-out to other team
      newServer = servingTeam === "team1" ? "team2" : "team1"
      newServerNumber = 1
    }
  } else {
    // Singles - just switch serving team
    newServer = servingTeam === "team1" ? "team2" : "team1"
  }

  // Calculate new server side based on new server's score
  const servingTeamScore = game.teams[newServer as keyof typeof game.teams].score
  const newServerSide = servingTeamScore % 2 === 0 ? "R" : "L"

  return {
    currentServer: newServer,
    serverNumber: newServerNumber,
    serverSide: newServerSide
  }
}

/**
 * Get receiver player ID for current serve
 */
export function getReceiver(game: GameState): string {
  if (!game.currentServer) return ""

  let receiverPlayerId = ""
  if (game.currentServer === "team1") {
    const serverPos = game.court.p1 === game.teams.team1.players[game.serverNumber - 1] ? "p1" : "p2"
    if (serverPos === "p1") {
      receiverPlayerId = game.serverSide === "R" ? game.court.p3 : game.court.p4
    } else {
      receiverPlayerId = game.serverSide === "R" ? game.court.p3 : game.court.p4
    }
  } else {
    const serverPos = game.court.p3 === game.teams.team2.players[game.serverNumber - 1] ? "p3" : "p4"
    if (serverPos === "p3") {
      receiverPlayerId = game.serverSide === "R" ? game.court.p1 : game.court.p2
    } else {
      receiverPlayerId = game.serverSide === "R" ? game.court.p1 : game.court.p2
    }
  }

  return receiverPlayerId
}

/**
 * Handle rally won by a team
 */
export async function rallyWon(gameId: string, teamId: string, game: GameState): Promise<void> {
  if (!game.currentServer || game.currentServer !== teamId) return

  const servingTeam = game.currentServer
  const servingTeamScore = game.teams[servingTeam as keyof typeof game.teams].score
  const newScore = servingTeamScore + 1

  // Check for win condition
  const opponentTeam = servingTeam === "team1" ? "team2" : "team1"
  const opponentScore = game.teams[opponentTeam as keyof typeof game.teams].score
  const hasWon = newScore >= game.maxScore && (newScore - opponentScore >= 2 || newScore >= game.maxScore + 1)

  if (hasWon) {
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
    } else if (team2Wins >= requiredWins) {
      matchWinner = "team2"
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
        serverNumber: 1
      })
    }
    return
  }

  // Serving team scores - they keep serving, court side changes based on new score parity
  const newServerSide = newScore % 2 === 0 ? "R" : "L"

  // When serving team scores, they switch sides - update court positions
  let newCourt = game.court
  if (servingTeam === "team1") {
    // Team 1 switches sides: p1 ↔ p2
    newCourt = { ...game.court, p1: game.court.p2, p2: game.court.p1 }
  } else {
    // Team 2 switches sides: p3 ↔ p4
    newCourt = { ...game.court, p3: game.court.p4, p4: game.court.p3 }
  }

  const updatedData = {
    [`teams/${servingTeam}/score`]: newScore,
    serverSide: newServerSide,
    court: newCourt,
    currentServer: game.currentServer
  }

  await update(ref(db, `games/pickle/${gameId}`), updatedData)
}

/**
 * Handle rally lost by a team
 */
export async function rallyLost(gameId: string, teamId: string, game: GameState): Promise<void> {
  if (!game.currentServer || game.currentServer !== teamId) return

  const serveUpdates = switchServe(game)

  await update(ref(db, `games/pickle/${gameId}`), serveUpdates)
}

/**
 * Check if game is in a finished state
 */
export function isGameFinished(game: GameState): boolean {
  return game.status === "finished" || game.status === "match_finished"
}

/**
 * Check if team can score (is currently serving)
 */
export function canTeamScore(game: GameState, teamId: string): boolean {
  return game.currentServer === teamId && !isGameFinished(game)
}

/**
 * Get game status message
 */
export function getGameStatus(game: GameState): string {
  if (game.status === "waiting_next_game") {
    return `Game ${game.currentGame - 1} Complete!`
  }
  if (game.status === "finished") {
    return "Game Over!"
  }
  if (game.status === "match_finished") {
    return "Match Complete!"
  }
  return ""
}

/**
 * Get winner information
 */
export function getWinner(game: GameState): { name: string; type: 'game' | 'match' } | null {
  if (game.status === "finished" && game.winner) {
    return {
      name: game.teams[game.winner as keyof typeof game.teams].name,
      type: 'game'
    }
  }
  if (game.status === "match_finished" && game.matchWinner) {
    return {
      name: game.teams[game.matchWinner as keyof typeof game.teams].name,
      type: 'match'
    }
  }
  return null
}
