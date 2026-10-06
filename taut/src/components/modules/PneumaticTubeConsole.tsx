import { useState } from "react";
import type { TubeColor } from "../../types/db-schema";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState, definitionById } from "../../lib/modules";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";
import { MODULE_GOALS } from "./goals";

const TUBES: TubeColor[] = ["Red", "Blue", "Green", "Yellow"];
const SWATCH: Record<TubeColor, string> = {
  Red: "#d93025",
  Blue: "#2f6df6",
  Green: "#1a9e5c",
  Yellow: "#b8860b",
};

/**
 * MOD_14_PNEUMATIC_TUBE — a document code plus four coloured tubes. Info 1 gives the document's
 * department; Info 2 maps the department to a tube. Answer: `{ tube }`.
 */
export function PneumaticTubeConsole({ state, disabled, submit, difficulty }: ModuleConsoleProps) {
  const { localVars } = narrowModuleState(state, "MOD_14_PNEUMATIC_TUBE");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const send = async (tube: TubeColor) => {
    if (disabled || pending || state.isSolved) return;
    setPending(true);
    setFeedback(null);
    try {
      const outcome = await submit({ tube });
      setFeedback(outcomeMessage(outcome));
    } finally {
      setPending(false);
    }
  };

  return (
    <BaseModuleWrapper
      title={definitionById("MOD_14_PNEUMATIC_TUBE").name}
      isSolved={state.isSolved}
      disabled={disabled}
      strikeSignal={0}
      goal={MODULE_GOALS.MOD_14_PNEUMATIC_TUBE}
      showGoalHint={difficulty === "BEGINNER"}
    >
      <div className="serial">{localVars.documentCode}</div>
      <div className="pad-grid">
        {TUBES.map((tube) => (
          <button
            key={tube}
            type="button"
            className="pad-btn"
            disabled={disabled || pending || state.isSolved}
            onClick={() => send(tube)}
          >
            <span className="tube-swatch" style={{ background: SWATCH[tube] }} />
            {tube}
          </button>
        ))}
      </div>
      <p className="module-feedback">{feedback}</p>
    </BaseModuleWrapper>
  );
}
