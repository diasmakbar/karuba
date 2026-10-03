import { useState } from "react";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState } from "../../lib/modules";
import { definitionById } from "../../lib/modules";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";

/**
 * MOD_01_WIRE — three or four colourless wires plus a serial number. The owner sees only the
 * physical wires; the two information pages tell them the colour order (Info 1) and which wire to
 * cut (Info 2). Answer: `{ wireIndex }`.
 */
export function WireConsole({ state, disabled, submit }: ModuleConsoleProps) {
  const { localVars } = narrowModuleState(state, "MOD_01_WIRE");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const cut = async (wireIndex: number) => {
    if (disabled || pending || state.isSolved) return;
    setPending(true);
    setFeedback(null);
    try {
      const outcome = await submit({ wireIndex });
      setFeedback(outcomeMessage(outcome));
    } finally {
      setPending(false);
    }
  };

  const indices = Array.from({ length: localVars.wireCount }, (_, i) => i);

  return (
    <BaseModuleWrapper
      title={definitionById("MOD_01_WIRE").name}
      isSolved={state.isSolved}
      disabled={disabled}
      strikeSignal={0}
    >
      <div className="serial">SN {localVars.serialNumber}</div>
      <div className="wires">
        {indices.map((index) => (
          <button
            key={index}
            type="button"
            className="wire"
            disabled={disabled || pending || state.isSolved}
            onClick={() => cut(index)}
            aria-label={`Cut wire ${index + 1}`}
          >
            <span className="wire-visual" />
            <span className="tag">{localVars.cutIndex === index ? "cut" : `wire ${index + 1}`}</span>
          </button>
        ))}
      </div>
      <p className="module-feedback">{feedback}</p>
    </BaseModuleWrapper>
  );
}
