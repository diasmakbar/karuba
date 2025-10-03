import React from "react"
import type { Game, Player } from "../lib/types"

type Props = {
  gameId: string
    game: Game
      me: Player
        version?: string
        }

        export default function RoomHeaderCard({ gameId, game, me, version = "v1.1." }: Props) {
          const currentTileLabel = me.actedForRound
              ? me.lastAction === "placed"
                    ? "Placed!"
                          : me.lastAction === "discarded"
                                ? "Discarded!"
                                      : "-"
                                          : game.currentTile || "-"

                                            return (
                                                <div className="card">
                                                      <h2 style={{ margin: "4px 0" }} className="font-display">Karuba Online</h2>
                                                            <p style={{ margin: "4px 0" }}>Game ID: {gameId}. {version}</p>
                                                                  <p style={{ margin: 0 }}>
                                                                          Status: {game.statusText} | Round: {game.round} | Current Tile: {currentTileLabel}
                                                                                </p>
                                                                                    </div>
                                                                                      )
                                                                                      }