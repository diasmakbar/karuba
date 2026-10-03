import { useRef, useState } from "react";
import type { ButtonAction } from "../../types/db-schema";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState, definitionById } from "../../lib/modules";
import { clockLabel } from "../../lib/modules/mod03Button";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";

/**
 * MOD_03_BUTTON — a big cipher button plus a serial. The holder presses and holds; the release
 * rule keys off the SHARED room clock (a digit contained anywhere in MM:SS, or the seconds'
 * parity), so there is no private screen. The owner's hold state is mirrored to Firebase via
 * `patch` so informants can see it. Answer: `{ action, secondsLeft }` measured against the clock.
 */
export function ButtonConsole({ state, disabled, submit, patch, secondsLeft }: ModuleConsoleProps) {
  const { localVars } = narrowModuleState(state, "MOD_03_BUTTON");
  const [holding, setHolding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Guards against pointerUp + pointerLeave both firing a release for the same press.
  const released = useRef(false);

  const startHold = async () => {
    if (disabled || pending || state.isSolved || holding) return;
    released.current = false;
    setHolding(true);
    try {
      await patch({ ...localVars, isHolding: true, holdStartedAt: Date.now() });
    } catch {
      // Non-fatal: the hold still works locally even if the mirror write lags.
    }
  };

  const release = async (action: ButtonAction) => {
    if (disabled || pending || state.isSolved) return;
    if (released.current) return;
    released.current = true;
    setHolding(false);
    setPending(true);
    setFeedback(null);
    try {
      const outcome = await submit({ action, secondsLeft });
      setFeedback(outcomeMessage(outcome));
      await patch({ ...localVars, isHolding: false, holdStartedAt: null });
    } finally {
      setPending(false);
    }
  };

  const clock = clockLabel(secondsLeft);

  return (
    <BaseModuleWrapper
      title={definitionById("MOD_03_BUTTON").name}
      isSolved={state.isSolved}
      disabled={disabled}
      strikeSignal={0}
    >
      <div className="serial">SN {localVars.serialNumber}</div>
      <div className="screen">
        <span className="tag">Shared clock</span>
        <div className="font-display" style={{ fontSize: 40 }}>
          {clock}
        </div>
      </div>
      <button
        type="button"
        className="btn btn-block btn-danger"
        disabled={disabled || pending || state.isSolved}
        aria-pressed={holding}
        onPointerDown={startHold}
        onPointerUp={() => release("HOLD_TO_TARGET")}
        onPointerLeave={() => (holding ? release("HOLD_TO_TARGET") : undefined)}
      >
        {holding ? "RELEASE" : localVars.cipher}
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-block"
        disabled={disabled || pending || state.isSolved || holding}
        onClick={() => release("RELEASE_NOW")}
      >
        Tap release now
      </button>
      <p className="module-feedback">{feedback}</p>
    </BaseModuleWrapper>
  );
}
