import type { Countdown } from "../hooks/useCountdown";
import type { RoomState } from "../types/db-schema";

interface HUDProps {
  room: RoomState;
  countdown: Countdown;
  connected: boolean;
  solved: number;
  total: number;
  onLeave: () => void;
}

function StrikeDots({ used, max }: { used: number; max: number }) {
  return (
    <div className="strike-dots" aria-label={`${used} strikes of ${max}`}>
      {Array.from({ length: Math.max(0, max) }, (_, index) => (
        <span key={index} className={`strike-dot ${index < used ? "is-used" : ""}`} />
      ))}
    </div>
  );
}

/** Room code, shared countdown and the strike meter. Read-only for every player. */
export function HUD({ room, countdown, connected, solved, total, onLeave }: HUDProps) {
  return (
    <header className="hud">
      <div className="hud-item">
        <span className="tag">Room</span>
        <span className="hud-value font-display">{room.id}</span>
      </div>

      <div className={`hud-item timer ${countdown.critical ? "is-critical" : ""}`}>
        <span className="tag">Time</span>
        <span className="hud-value font-display">{countdown.label}</span>
      </div>

      <div className="hud-item">
        <span className="tag">Strikes</span>
        <StrikeDots used={room.strikeCount} max={room.maxStrikes} />
      </div>

      <div className="hud-item">
        <span className="tag">Defused</span>
        <span className="hud-value font-display">
          {solved}/{total}
        </span>
      </div>

      <div className="row" style={{ marginLeft: "auto", gap: 8 }}>
        {!connected ? <span className="banner is-error">Reconnecting…</span> : null}
        <button type="button" className="btn btn-ghost" onClick={onLeave}>
          Leave
        </button>
      </div>
    </header>
  );
}
