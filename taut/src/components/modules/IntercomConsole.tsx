import { useState } from "react";
import type { IntercomResponse } from "../../types/db-schema";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState, definitionById } from "../../lib/modules";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";

/**
 * MOD_11_INTERCOM — an incoming alien message plus the dealt reply options. Info 1 translates the
 * message; Info 2 gives the reply protocol. Answer: `{ response }`.
 *
 * The reply buttons come from the per-instance `responses` dealt at generate time (5/10 by
 * difficulty); the correct reply is always among them.
 */
export function IntercomConsole({ state, disabled, submit }: ModuleConsoleProps) {
  const { localVars } = narrowModuleState(state, "MOD_11_INTERCOM");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // RTDB drops empty arrays; fall back to a small default if the dealt list ever goes missing.
  const responses: IntercomResponse[] = Array.isArray(localVars.responses) && localVars.responses.length > 0
    ? (localVars.responses as IntercomResponse[])
    : ["BARADA", "NIKTO", "SHREK", "FIONA"];

  const reply = async (response: IntercomResponse) => {
    if (disabled || pending || state.isSolved) return;
    setPending(true);
    setFeedback(null);
    try {
      const outcome = await submit({ response });
      setFeedback(outcomeMessage(outcome));
    } finally {
      setPending(false);
    }
  };

  return (
    <BaseModuleWrapper
      title={definitionById("MOD_11_INTERCOM").name}
      isSolved={state.isSolved}
      disabled={disabled}
      strikeSignal={0}
    >
      <div className="screen">
        <span className="tag">Incoming</span>
        <div className="font-display">{localVars.incomingMessage}</div>
      </div>
      <div className="pad-grid">
        {responses.map((response) => (
          <button
            key={response}
            type="button"
            className="pad-btn"
            disabled={disabled || pending || state.isSolved}
            onClick={() => reply(response)}
          >
            {response}
          </button>
        ))}
      </div>
      <p className="module-feedback">{feedback}</p>
    </BaseModuleWrapper>
  );
}
