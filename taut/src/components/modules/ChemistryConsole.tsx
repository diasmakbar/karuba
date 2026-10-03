import { useState } from "react";
import type { ShapeId } from "../../types/db-schema";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState, definitionById } from "../../lib/modules";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";

const SHAPES: ShapeId[] = ["Triangle", "Square", "Hexagon", "Circle"];

/**
 * MOD_05_CHEMISTRY — a hazard symbol plus four shape buttons. Info 1 names the antidote colour,
 * Info 2 maps each shape to a colour, so the owner presses the shapes that mix to the antidote.
 * Answer: `{ buttonsPressed }`.
 */
export function ChemistryConsole({ state, disabled, submit }: ModuleConsoleProps) {
  const { localVars } = narrowModuleState(state, "MOD_05_CHEMISTRY");
  const [pressed, setPressed] = useState<ShapeId[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const toggle = (shape: ShapeId) => {
    if (disabled || pending || state.isSolved) return;
    setPressed((current) =>
      current.includes(shape) ? current.filter((s) => s !== shape) : current.length >= 2 ? current : [...current, shape],
    );
  };

  const confirm = async () => {
    if (disabled || pending || state.isSolved || pressed.length === 0) return;
    setPending(true);
    setFeedback(null);
    try {
      const outcome = await submit({ buttonsPressed: pressed });
      setFeedback(outcomeMessage(outcome));
      setPressed([]);
    } finally {
      setPending(false);
    }
  };

  return (
    <BaseModuleWrapper
      title={definitionById("MOD_05_CHEMISTRY").name}
      isSolved={state.isSolved}
      disabled={disabled}
      strikeSignal={0}
    >
      <div className="screen" data-hazard={localVars.hazardSymbol}>
        <span className="tag">Hazard</span>
        <div className="font-display">{localVars.hazardSymbol}</div>
      </div>
      <div className="pad-grid">
        {SHAPES.map((shape) => (
          <button
            key={shape}
            type="button"
            className={`pad-btn ${pressed.includes(shape) ? "is-active" : ""}`}
            disabled={disabled || pending || state.isSolved}
            onClick={() => toggle(shape)}
          >
            {shape}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-block"
        disabled={disabled || pending || state.isSolved || pressed.length === 0}
        onClick={confirm}
      >
        Mix ({pressed.length}/2)
      </button>
      <p className="module-feedback">{feedback}</p>
    </BaseModuleWrapper>
  );
}
