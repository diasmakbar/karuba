import { useState } from "react";
import type { Direction } from "../../types/db-schema";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState, definitionById } from "../../lib/modules";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";

const COLUMNS = ["A", "B", "C", "D", "E", "F"];
const ROWS = [1, 2, 3, 4, 5, 6];

/**
 * MOD_02_INVISIBLE_MAZE — a 6x6 grid and a D-pad. The owner sees only the token; the informants
 * describe the hidden walls (Info 1) and the serial-number rotation (Info 2). Each step submits
 * `{ direction }`; the host advances the token, or strikes on a wall.
 */
export function InvisibleMazeConsole({ state, disabled, submit }: ModuleConsoleProps) {
  const { localVars } = narrowModuleState(state, "MOD_02_INVISIBLE_MAZE");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const move = async (direction: Direction) => {
    if (disabled || pending || state.isSolved) return;
    setPending(true);
    setFeedback(null);
    try {
      const outcome = await submit({ direction });
      setFeedback(outcomeMessage(outcome));
    } finally {
      setPending(false);
    }
  };

  return (
    <BaseModuleWrapper
      title={definitionById("MOD_02_INVISIBLE_MAZE").name}
      isSolved={state.isSolved}
      disabled={disabled}
      strikeSignal={0}
    >
      <div className="serial">SN {localVars.serialNumber}</div>
      <div className="cell-grid" style={{ gridTemplateColumns: `repeat(${COLUMNS.length}, 1fr)` }}>
        {ROWS.map((row) =>
          COLUMNS.map((column) => {
            const coord = `${column}${row}`;
            const here = localVars.currentCoord === coord;
            const finish = localVars.finishCoord === coord;
            const start = localVars.startCoord === coord;
            return (
              <div
                key={coord}
                className={`cell ${here ? "is-active" : ""} ${finish ? "is-target" : ""}`}
                title={coord}
              >
                {here ? "◉" : finish ? "◎" : start ? "○" : ""}
              </div>
            );
          }),
        )}
      </div>
      <div className="dpad">
        <span />
        <button type="button" className="key" disabled={disabled || pending || state.isSolved} onClick={() => move("UP")}>
          ↑
        </button>
        <span />
        <button type="button" className="key" disabled={disabled || pending || state.isSolved} onClick={() => move("LEFT")}>
          ←
        </button>
        <span />
        <button type="button" className="key" disabled={disabled || pending || state.isSolved} onClick={() => move("RIGHT")}>
          →
        </button>
        <span />
        <button type="button" className="key" disabled={disabled || pending || state.isSolved} onClick={() => move("DOWN")}>
          ↓
        </button>
        <span />
      </div>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>
        Token {localVars.currentCoord} · exit {localVars.finishCoord}
      </p>
      <p className="module-feedback">{feedback}</p>
    </BaseModuleWrapper>
  );
}
