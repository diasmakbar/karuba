import React from "react"
import { Player, Game } from "../lib/types"

interface RoomPlayersCardProps {
  game: Game
  players: Record<string, Player>
  currentPlayerId: string
}

const RoomPlayersCard: React.FC<RoomPlayersCardProps> = ({ game, players, currentPlayerId }) => {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }} className="font-display">Players</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {Object.values(players || {})
          .sort((a, b) => a.joinedAt - b.joinedAt)
          .map((p) => {
            const isTurn = game.generateTurnUid === p.id && game.round >= 2 && game.currentTile === 0
            const isPlayerFinished = !p.explorers || Object.keys(p.explorers).length === 0
            const state = isPlayerFinished
              ? "finished"
              : p.doneForRound
              ? "ready ✅"
              : p.actedForRound
              ? "placed tile"
              : "playing"
            return (
              <li key={p.id} style={{ marginBottom: 4, fontWeight: isTurn ? 700 : 400 }}>
                {p.name} — Score: {p.score} ({state})
                {p.id === currentPlayerId ? " ← you" : ""}
              </li>
            )
          })}
      </ul>
      {game.lastEvent && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed rgba(0,0,0,0.15)" }}>
          <em>{game.lastEvent}</em>
        </div>
      )}
    </div>
  )
}

export default RoomPlayersCard
