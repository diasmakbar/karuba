import { LanguageToggle } from "./LanguageToggle";
import { useT } from "../lib/i18n/useT";
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

function StrikeDots({ used, max, noLimitLabel }: { used: number; max: number; noLimitLabel: string }) {
  // max === 0 is the "no limit" mode: show the running count instead of a fixed meter.
  if (max <= 0) {
    return (
      <span className="hud-value" aria-label={`${used} — ${noLimitLabel}`}>
        {used} · ∞
      </span>
    );
  }
  return (
    <div className="strike-dots" aria-label={`${used} / ${max}`}>
      {Array.from({ length: Math.max(0, max) }, (_, index) => (
        <span key={index} className={`strike-dot ${index < used ? "is-used" : ""}`} />
      ))}
    </div>
  );
}

/** Room code, shared countdown and the strike meter. Read-only for every player. */
export function HUD({ room, countdown, connected, solved, total, onLeave }: HUDProps) {
  const t = useT();
  return (
    <header className="hud">
      <div className="hud-item">
        <span className="tag">{t("hud.room")}</span>
        <span className="hud-value font-display">{room.id}</span>
      </div>

      <div className={`hud-item timer ${countdown.critical ? "is-critical" : ""}`}>
        <span className="tag">{t("hud.time")}</span>
        <span className="hud-value font-display">{countdown.label}</span>
      </div>

      <div className="hud-item">
        <span className="tag">{t("hud.strikes")}</span>
        <StrikeDots used={room.strikeCount} max={room.maxStrikes} noLimitLabel={t("hud.noLimit")} />
      </div>

      <div className="hud-item">
        <span className="tag">{t("hud.defused")}</span>
        <span className="hud-value font-display">
          {solved}/{total}
        </span>
      </div>

      <div className="row" style={{ marginLeft: "auto", gap: 8 }}>
        {!connected ? <span className="banner is-error">{t("common.reconnecting")}</span> : null}
        <LanguageToggle />
        <button type="button" className="btn btn-ghost" onClick={onLeave}>
          {t("common.leave")}
        </button>
      </div>
    </header>
  );
}
