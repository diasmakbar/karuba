import { useState } from "react";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState, definitionById } from "../../lib/modules";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";
import { MODULE_GOALS } from "./goals";

/**
 * MOD_13_SHAPE_SORTER — two filter states plus a dealt set of objects (colour + shape; 2 for
 * Beginner, else 5). Info 1 says what Filter Alpha rejects; Info 2 says what Filter Beta
 * requires. Answer: the one object that passes
 * both — `{ objectIndex }`.
 */
export function ShapeSorterConsole({ state, disabled, submit, difficulty }: ModuleConsoleProps) {
  const { localVars } = narrowModuleState(state, "MOD_13_SHAPE_SORTER");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const pick = async (objectIndex: number) => {
    if (disabled || pending || state.isSolved) return;
    setPending(true);
    setFeedback(null);
    try {
      const outcome = await submit({ objectIndex });
      setFeedback(outcomeMessage(outcome));
    } finally {
      setPending(false);
    }
  };

  return (
    <BaseModuleWrapper
      title={definitionById("MOD_13_SHAPE_SORTER").name}
      isSolved={state.isSolved}
      disabled={disabled}
      strikeSignal={0}
      goal={MODULE_GOALS.MOD_13_SHAPE_SORTER}
      showGoalHint={difficulty === "BEGINNER"}
    >
      <div className="screen">
        <span className="tag">Filter Alpha</span>
        <div className="font-display">{localVars.filterAlpha}</div>
        <span className="tag">Filter Beta</span>
        <div className="font-display">{localVars.filterBeta}</div>
      </div>
      <div className="pad-grid">
        {localVars.objects.map((object, index) => (
          <button
            key={index}
            type="button"
            className="pad-btn"
            disabled={disabled || pending || state.isSolved}
            onClick={() => pick(index)}
          >
            <span className="tag">{object.color}</span>
            <span>{object.shape}</span>
          </button>
        ))}
      </div>
      <p className="module-feedback">{feedback}</p>
    </BaseModuleWrapper>
  );
}
