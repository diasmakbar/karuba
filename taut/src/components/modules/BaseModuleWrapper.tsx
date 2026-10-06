import { useEffect, useRef, useState, type ReactNode } from "react";
import { useT } from "../../lib/i18n/useT";

interface BaseModuleWrapperProps {
  title: string;
  isSolved: boolean;
  disabled: boolean;
  /** Bumped by the parent when a strike happens anywhere in the room, to flash feedback. */
  strikeSignal: number;
  /** One-line objective. Only shown to the owner in BEGINNER rooms as a new-player hint. */
  goal?: string;
  /** When true (BEGINNER difficulty), the goal hint is displayed. */
  showGoalHint?: boolean;
  children: ReactNode;
}

/**
 * Shared shell for every owner console: title, solved state, and strike/success feedback.
 * Consoles stay presentation-only; this wrapper owns the visual reaction to outcomes.
 */
export function BaseModuleWrapper({
  title,
  isSolved,
  disabled,
  strikeSignal,
  goal,
  showGoalHint,
  children,
}: BaseModuleWrapperProps) {
  const t = useT();
  const [flash, setFlash] = useState<"strike" | "success" | null>(null);
  const prevSolved = useRef(isSolved);
  const prevStrike = useRef(strikeSignal);

  useEffect(() => {
    if (isSolved && !prevSolved.current) {
      setFlash("success");
      const id = window.setTimeout(() => setFlash(null), 800);
      prevSolved.current = isSolved;
      return () => window.clearTimeout(id);
    }
    prevSolved.current = isSolved;
    return undefined;
  }, [isSolved]);

  useEffect(() => {
    if (strikeSignal !== prevStrike.current) {
      setFlash("strike");
      const id = window.setTimeout(() => setFlash(null), 1700);
      prevStrike.current = strikeSignal;
      return () => window.clearTimeout(id);
    }
    prevStrike.current = strikeSignal;
    return undefined;
  }, [strikeSignal]);

  const flashClass = flash === "strike" ? "flash-strike" : flash === "success" ? "flash-success" : "";

  return (
    <section className={`module ${isSolved ? "is-solved" : ""} ${flashClass}`}>
      <header className="module-head">
        <h3 className="module-title">{title}</h3>
        {isSolved ? <span className="solved-stamp">SOLVED</span> : null}
      </header>
      {showGoalHint && goal ? (
        <p className="module-goal">
          <span className="module-goal-tag">{t("module.goal")}</span>
          {goal}
        </p>
      ) : null}
      <div className="module-body" aria-disabled={disabled}>
        {children}
      </div>
    </section>
  );
}
