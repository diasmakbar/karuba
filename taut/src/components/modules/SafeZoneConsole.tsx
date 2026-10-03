import { useState } from "react";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState, definitionById } from "../../lib/modules";
import { GRID_COLUMNS } from "../../lib/rng";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";

const SAFE_COLUMNS = GRID_COLUMNS.slice(0, 3);
const SAFE_ROWS = [1, 2, 3];

/**
 * MOD_12_SAFE_ZONE — a threat and a room hazard over a 3x3 grid. Info 1 marks cells the threat
 * covers; Info 2 marks cells the room covers. Answer: the single uncovered cell — `{ coord }`.
 */
export function SafeZoneConsole({ state, disabled, submit }: ModuleConsoleProps) {
  const { localVars } = narrowModuleState(state, "MOD_12_SAFE_ZONE");
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const confirm = async () => {
    if (disabled || pending || state.isSolved || !selected) return;
    setPending(true);
    setFeedback(null);
    try {
      const outcome = await submit({ coord: selected });
      setFeedback(outcomeMessage(outcome));
    } finally {
      setPending(false);
    }
  };

  return (
    <BaseModuleWrapper
      title={definitionById("MOD_12_SAFE_ZONE").name}
      isSolved={state.isSolved}
      disabled={disabled}
      strikeSignal={0}
    >
      <div className="screen">
        <span className="tag">Threat</span>
        <div className="font-display">{localVars.threat}</div>
        <span className="tag">Room</span>
        <div className="font-display">{localVars.room}</div>
      </div>
      <div className="cell-grid" style={{ gridTemplateColumns: `repeat(${SAFE_COLUMNS.length}, 1fr)` }}>
        {SAFE_ROWS.map((row) =>
          SAFE_COLUMNS.map((column) => {
            const coord = `${column}${row}`;
            return (
              <button
                key={coord}
                type="button"
                className={`cell ${selected === coord ? "is-active" : ""}`}
                disabled={disabled || pending || state.isSolved}
                onClick={() => setSelected(coord)}
              >
                {coord}
              </button>
            );
          }),
        )}
      </div>
      <button
        type="button"
        className="btn btn-block"
        disabled={disabled || pending || state.isSolved || !selected}
        onClick={confirm}
      >
        {selected ? `Confirm ${selected}` : "Select a cell"}
      </button>
      <p className="module-feedback">{feedback}</p>
    </BaseModuleWrapper>
  );
}
