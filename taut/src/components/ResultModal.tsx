import type { PlayerState, RoomState } from "../types/db-schema";
import { playerList } from "../utils/room";
import { solvedCount } from "../utils/game";
import { useT } from "../lib/i18n/useT";

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
  const t = useT();
  const won = room.status === "VICTORY";
  return (
    <div className="modal-backdrop">
      <div className="card stack" style={{ maxWidth: 420, width: "100%" }}>
        <h2 className="font-display" style={{ margin: 0 }}>
          {won ? t("result.complete") : t("result.failed")}
        </h2>
        <p className="muted" style={{ margin: 0 }}>
          {won
            ? t("result.completeBody", { level: room.level, total: room.totalLevels })
            : t("result.failedBody", { count: room.strikeCount })}
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
              {t("result.backToWaiting")}
            </button>
          ) : (
            <p className="muted" style={{ margin: 0, alignSelf: "center" }}>
              {t("result.waitingHost")}
            </p>
          )}
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={onLeave}>
            {t("common.leave")}
          </button>
        </div>
      </div>
    </div>
  );
}
