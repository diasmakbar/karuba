import React from "react"
import type { Game, Player } from "../lib/types"

type Props = {
      game: Game
        players: Record<string, Player>
          playerId: string
}

export default function RoomPlayersCard({ game, players, playerId }: Props) {
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
                                                                                                                                      ? "ready ✓"
                                                                                                                                                    : p.actedForRound
                                                                                                                                                                  ? "placed tile"
                                                                                                                                                                                : "playing"
                                                                                                                                                                                            return (
                                                                                                                                                                                                              <li key={p.id} style={{ marginBottom: 4, fontWeight: isTurn ? 700 : 400 }}>
                                                                                                                                                                                                                              {p.name} - Score: {p.score} ({state})
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
                                                                )}
                                                                                                                                                                                            )
                                                    })}
      )
}
}