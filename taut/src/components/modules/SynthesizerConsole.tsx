import { useState } from "react";
import type { VialId } from "../../types/db-schema";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState, definitionById } from "../../lib/modules";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";

const VIALS: VialId[] = ["Alpha", "Beta", "Gamma", "Delta"];

/**
 * MOD_09_SYNTHESIZER — a target type plus four abstract vials. Info 1 lists the target's pH/temp
 * requirements; Info 2 maps each vial to a pH/temp. Answer: `{ vial }`.
 */
export function SynthesizerConsole({ state, disabled, submit }: ModuleConsoleProps) {
  const { localVars } = narrowModuleState(state, "MOD_09_SYNTHESIZER");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const pick = async (vial: VialId) => {
    if (disabled || pending || state.isSolved) return;
    setPending(true);
    setFeedback(null);
    try {
      const outcome = await submit({ vial });
      setFeedback(outcomeMessage(outcome));
    } finally {
      setPending(false);
    }
  };

  return (
    <BaseModuleWrapper
      title={definitionById("MOD_09_SYNTHESIZER").name}
      isSolved={state.isSolved}
      disabled={disabled}
      strikeSignal={0}
    >
      <div className="screen">
        <span className="tag">Target</span>
        <div className="font-display">{localVars.targetType}</div>
      </div>
      <div className="pad-grid">
        {VIALS.map((vial) => (
          <button
            key={vial}
            type="button"
            className="pad-btn"
            disabled={disabled || pending || state.isSolved}
            onClick={() => pick(vial)}
          >
            {vial}
          </button>
        ))}
      </div>
      <p className="module-feedback">{feedback}</p>
    </BaseModuleWrapper>
  );
}
