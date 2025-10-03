import React from "react"
import type { Game, Player } from "../lib/types"
import Controls from "../components/Controls"
import { TileIcon } from "../components/Board"

type Props = {
  isHost: boolean
  game: Game
  players: Record<string, Player>
  playerId: string
  me: Player
  canGenerate: boolean
  onStartOrGenerate: () => void
  onReadyNextRound: () => void
  readyDisabled: boolean
  waitingLabel: string
  canPlace: boolean
  onTrash: () => void
  onOpenDiscard: () => void
}

export default function RoomMainPanel(props: Props) {
  const {
    isHost, game, playerId, players, me,
    canGenerate, onStartOrGenerate, onReadyNextRound,
    readyDisabled, waitingLabel, canPlace, onTrash, onOpenDiscard,
  } = props

  return (
    <div className="card">
      <Controls
        isHost={isHost}
        status={game.status}
        round={game.round}
        canGenerate={!!canGenerate}
        onStartOrGenerate={onStartOrGenerate}
        onReady={onReadyNextRound}
        readyDisabled={readyDisabled}
        waitingLabel={waitingLabel}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
        <strong>Current Tile:</strong>
        {me.actedForRound ? (
          <span>{me.lastAction === "placed" ? "Placed!" : "Discarded!"}</span>
        ) : game.currentTile > 0 ? (
          <TileIcon
            id={game.currentTile}
            tilesMeta={(game.tilesMeta || {}) as any}
            size={40}
            reward={game.rewards?.[game.currentTile]}
          />
        ) : (
          <span>-</span>
        )}
        <span style={{ opacity: 0.5 }}>|</span>
        <span>Moves: {me.moves}</span>
        <img
          src="/trash.svg"
          alt="Trash"
          title={game.currentTile > 0 && canPlace ? "Discard tile" : "No tile to discard"}
          onClick={onTrash}
          style={{
            width: 28,
            height: 28,
            cursor: game.currentTile > 0 && canPlace ? "pointer" : "default",
            opacity: game.currentTile > 0 && canPlace ? 1 : 0.5,
          }}
        />
        <button onClick={onOpenDiscard} style={{ marginLeft: 4 }}>
          Discarded Tiles
        </button>
      </div>
    </div>
  )
}