import { useState } from "react";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState, definitionById } from "../../lib/modules";
import { GRID_COLUMNS } from "../../lib/rng";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";

/**
 * MOD_12_SAFE_ZONE — a threat and a room hazard over an NxN grid (N scales with difficulty).
 * Info 1 lists the cells each threat covers; Info 2 lists the cells each room covers. Answer: the
 * single cell in BOTH the owner's threat set and the owner's room set (their intersection) — `{ coord }`.
 */
export function SafeZoneConsole({ state, disabled, submit }: ModuleConsoleProps) {
  const { localVars } = narrowModuleState(state, "MOD_12_SAFE_ZONE");
  const gridSize = localVars.gridSize;
  const columns = GRID_COLUMNS.slice(0, gridSize);
  const rows = columns.map((_, index) => index + 1);
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
      <div className="cell-grid" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
        {rows.map((row) =>
          columns.map((column) => {
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
