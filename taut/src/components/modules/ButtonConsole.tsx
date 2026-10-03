import { useEffect, useRef, useState } from "react";
import type { ButtonAction } from "../../types/db-schema";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState, definitionById } from "../../lib/modules";
import { countdownValue } from "../../lib/modules/mod03Button";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";

/**
 * MOD_03_BUTTON — a big cipher button plus a serial. The holder presses and holds; the local
 * countdown screen rolls 1-9 once per second. Releasing too soon is a strike; the correct release
 * rule comes from Info 1 (cipher → command) and Info 2 (command → release timing). The owner's
 * hold state is mirrored to Firebase via `patch` so informants see it. Answer: `{ action, elapsedMs }`.
 */
export function ButtonConsole({ state, disabled, submit, patch }: ModuleConsoleProps) {
  const { localVars } = narrowModuleState(state, "MOD_03_BUTTON");
  const [holding, setHolding] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!holding) return undefined;
    const id = window.setInterval(() => {
      if (startedAt.current !== null) setElapsedMs(Date.now() - startedAt.current);
    }, 200);
    return () => window.clearInterval(id);
  }, [holding]);

  const startHold = async () => {
    if (disabled || pending || state.isSolved || holding) return;
    startedAt.current = Date.now();
    setElapsedMs(0);
    setHolding(true);
    try {
      await patch({ ...localVars, isHolding: true, holdStartedAt: startedAt.current });
    } catch {
      // Non-fatal: the hold still works locally even if the mirror write lags.
    }
  };

  const release = async (action: ButtonAction) => {
    if (disabled || pending || state.isSolved) return;
    const elapsed = startedAt.current === null ? 0 : Date.now() - startedAt.current;
    startedAt.current = null;
    setHolding(false);
    setPending(true);
    setFeedback(null);
    try {
      const outcome = await submit({ action, elapsedMs: elapsed });
      setFeedback(outcomeMessage(outcome));
      await patch({ ...localVars, isHolding: false, holdStartedAt: null });
    } finally {
      setPending(false);
    }
  };

  const pressNow = async () => {
    // Quick tap: depending on the rule this is either "release now" (DROP) or an early strike.
    await release("RELEASE_NOW");
  };

  const drop = async () => {
    // Press and let go at once for the DROP rule.
    if (disabled || pending || state.isSolved) return;
    setPending(true);
    setFeedback(null);
    try {
      const outcome = await submit({ action: "EARLY", elapsedMs: 0 });
      setFeedback(outcomeMessage(outcome));
    } finally {
      setPending(false);
    }
  };

  const screen = countdownValue(elapsedMs);

  return (
    <BaseModuleWrapper
      title={definitionById("MOD_03_BUTTON").name}
      isSolved={state.isSolved}
      disabled={disabled}
      strikeSignal={0}
    >
      <div className="serial">SN {localVars.serialNumber}</div>
      <div className="screen">
        <span className="tag">{holding ? "Hold — release on your number" : "Countdown screen"}</span>
        <div className="font-display" style={{ fontSize: 40 }}>
          {screen}
        </div>
      </div>
      <button
        type="button"
        className="btn btn-block btn-danger"
        disabled={disabled || pending || state.isSolved}
        aria-pressed={holding}
        onPointerDown={startHold}
        onPointerUp={() => holding && release("HOLD_TO_TARGET")}
        onPointerLeave={() => holding && release("HOLD_TO_TARGET")}
      >
        {holding ? "RELEASE" : localVars.cipher}
      </button>
      <div className="row" style={{ gap: 8 }}>
        <button
          type="button"
          className="btn btn-ghost btn-block"
          disabled={disabled || pending || state.isSolved || holding}
          onClick={pressNow}
        >
          Tap release
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-block"
          disabled={disabled || pending || state.isSolved || holding}
          onClick={drop}
        >
          Drop at once
        </button>
      </div>
      <p className="module-feedback">{feedback}</p>
    </BaseModuleWrapper>
  );
}
