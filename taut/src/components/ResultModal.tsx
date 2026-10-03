import type { PlayerState, RoomState } from "../types/db-schema";
import { playerList } from "../utils/room";
import { solvedCount } from "../utils/game";

interface ResultModalProps {
  room: RoomState;
  isHost: boolean;
  onPlayAgain: () => void;
  onLeave: () => void;
  busy: boolean;
}

function solvedLabel(player: PlayerState): string {
  const total = Object.keys(player.activeModules ?? {}).length;
  return `${solvedCount(player)}/${total}`;
}

/** Victory / defeat overlay shown once the room leaves the PLAYING state for good. */
export function ResultModal({ room, isHost, onPlayAgain, onLeave, busy }: ResultModalProps) {
  const won = room.status === "VICTORY";
  return (
    <div className="modal-backdrop">
      <div className="card stack" style={{ maxWidth: 420, width: "100%" }}>
        <h2 className="font-display" style={{ margin: 0 }}>
          {won ? "Mission complete" : "Mission failed"}
        </h2>
        <p className="muted" style={{ margin: 0 }}>
          {won
            ? `All modules cleared on level ${room.level} of ${room.totalLevels}.`
            : `The ship went down with ${room.strikeCount} strikes on the board.`}
        </p>

        <div className="stack" style={{ gap: 6 }}>
          {playerList(room).map((player) => (
            <div key={player.id} className="player-row">
              <span>{player.name}</span>
              <span className="badge">{solvedLabel(player)}</span>
            </div>
          ))}
        </div>

        <div className="row" style={{ gap: 8 }}>
          {isHost ? (
            <button type="button" className="btn btn-block" disabled={busy} onClick={onPlayAgain}>
              Play again
            </button>
          ) : (
            <p className="muted" style={{ margin: 0, alignSelf: "center" }}>
              Waiting for the host…
            </p>
          )}
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={onLeave}>
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}
