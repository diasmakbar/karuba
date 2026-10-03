import { useState } from "react";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState, definitionById } from "../../lib/modules";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";

/**
 * MOD_15_BIOMETRIC_SCANNER — a person and a destination. Info 1 gives the clearance the
 * destination needs; Info 2 gives the person's clearance level. Approve iff clearance >= required.
 * Answer: `{ action }`.
 */
export function BiometricScannerConsole({ state, disabled, submit }: ModuleConsoleProps) {
  const { localVars } = narrowModuleState(state, "MOD_15_BIOMETRIC_SCANNER");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const decide = async (action: "APPROVE" | "REJECT") => {
    if (disabled || pending || state.isSolved) return;
    setPending(true);
    setFeedback(null);
    try {
      const outcome = await submit({ action });
      setFeedback(outcomeMessage(outcome));
    } finally {
      setPending(false);
    }
  };

  return (
    <BaseModuleWrapper
      title={definitionById("MOD_15_BIOMETRIC_SCANNER").name}
      isSolved={state.isSolved}
      disabled={disabled}
      strikeSignal={0}
    >
      <div className="screen">
        <span className="tag">Person</span>
        <div className="font-display">{localVars.personName}</div>
        <span className="tag">Destination</span>
        <div className="font-display">{localVars.destination}</div>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <button
          type="button"
          className="btn btn-success btn-block"
          disabled={disabled || pending || state.isSolved}
          onClick={() => decide("APPROVE")}
        >
          Approve
        </button>
        <button
          type="button"
          className="btn btn-danger btn-block"
          disabled={disabled || pending || state.isSolved}
          onClick={() => decide("REJECT")}
        >
          Reject
        </button>
      </div>
      <p className="module-feedback">{feedback}</p>
    </BaseModuleWrapper>
  );
}
