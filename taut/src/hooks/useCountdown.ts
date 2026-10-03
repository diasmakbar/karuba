import { useEffect, useState } from "react";

export interface Countdown {
  secondsLeft: number;
  label: string;
  expired: boolean;
  critical: boolean;
}

function format(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Countdown derived from `room.globalEndTime`. Only the clock is local — the room node is
 * never rewritten by this hook, which is what "do not use interval-based writes for timers"
 * means in practice.
 */
export function useCountdown(globalEndTime: number | null): Countdown {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!globalEndTime) return undefined;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [globalEndTime]);

  if (!globalEndTime) {
    return { secondsLeft: 0, label: "--:--", expired: false, critical: false };
  }

  const secondsLeft = Math.max(0, Math.ceil((globalEndTime - now) / 1000));
  return {
    secondsLeft,
    label: format(secondsLeft),
    expired: secondsLeft <= 0,
    critical: secondsLeft <= 60,
  };
}
