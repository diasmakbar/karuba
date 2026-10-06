import { useState } from "react";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState, definitionById } from "../../lib/modules";
import { GRID_COLUMNS, coordFrom } from "../../lib/rng";
import { radarGridSize } from "../../lib/gameConfig";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";
import { MODULE_GOALS } from "./goals";

/**
 * MOD_08_RADAR — a 5x5 grid plus a constellation and a wind arrow. Info 1 gives the epicentre for
 * the constellation; Info 2 drifts it by the wind. Answer: `{ coord }`.
 */
export function RadarConsole({ state, disabled, submit, difficulty }: ModuleConsoleProps) {
  const { localVars } = narrowModuleState(state, "MOD_08_RADAR");
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Beginner 5x5, otherwise 8x8 (capped so the grid never overflows a phone screen).
  const size = radarGridSize(difficulty);
  const columns = GRID_COLUMNS.slice(0, size);
  const rows = columns.map((_column, index) => index + 1);

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
      title={definitionById("MOD_08_RADAR").name}
      isSolved={state.isSolved}
      disabled={disabled}
      strikeSignal={0}
      goal={MODULE_GOALS.MOD_08_RADAR}
      showGoalHint={difficulty === "BEGINNER"}
    >
      <div className="screen">
        <span className="tag">Constellation</span>
        <div className="font-display">{localVars.constellation}</div>
        <span className="tag">Wind</span>
        <div className="font-display">{localVars.windDirection}</div>
      </div>
      <div className="cell-grid radar-grid" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
        {rows.map((row) =>
          columns.map((_column, colIndex) => {
            const coord = coordFrom(colIndex, row - 1);
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
