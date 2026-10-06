import { Fragment, useState } from "react";
import type { Direction } from "../../types/db-schema";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState, definitionById } from "../../lib/modules";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";
import { MODULE_GOALS } from "./goals";
import { useT } from "../../lib/i18n/useT";

const COLUMNS = ["A", "B", "C", "D", "E", "F"];
const ROWS = [1, 2, 3, 4, 5, 6];

/**
 * MOD_02_INVISIBLE_MAZE — a 6x6 grid and a D-pad. The owner sees only the token; the informants
 * describe the hidden walls (Info 1) and the serial-number rotation (Info 2). Each step submits
 * `{ direction }`; the host advances the token, or strikes on a wall.
 */
export function InvisibleMazeConsole({ state, disabled, submit, difficulty }: ModuleConsoleProps) {
  const t = useT();
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
      goal={MODULE_GOALS.MOD_02_INVISIBLE_MAZE}
      showGoalHint={difficulty === "BEGINNER"}
    >
      <div className="serial">{t("module.serial")} {localVars.serialNumber}</div>
      <div className="cell-grid maze-grid" style={{ gridTemplateColumns: `auto repeat(${COLUMNS.length}, 1fr)` }}>
        {/* Column legend header: A–F across the top. */}
        <span className="maze-axis" aria-hidden="true" />
        {COLUMNS.map((column) => (
          <span key={`head-${column}`} className="maze-axis">
            {column}
          </span>
        ))}
        {ROWS.map((row) => (
          <Fragment key={`row-${row}`}>
            {/* Row legend: 1–6 down the left. */}
            <span className="maze-axis">{row}</span>
            {COLUMNS.map((column) => {
              const coord = `${column}${row}`;
              // On solve the token snaps into the exit so the winning press visibly lands there.
              const token = (state.isSolved ? localVars.finishCoord : localVars.currentCoord) === coord;
              const isFinish = localVars.finishCoord === coord;
              const isStart = localVars.startCoord === coord;
              const classes = ["cell", isStart ? "is-start" : "", isFinish ? "is-finish" : "", token ? "is-token" : ""];
              // Token glyph wins on overlap; S/F only show when the token is not on that cell.
              const glyph = token ? "◉" : isFinish ? "F" : isStart ? "S" : "";
              return (
                <div key={coord} className={classes.join(" ")} title={coord}>
                  {glyph}
                </div>
              );
            })}
          </Fragment>
        ))}
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
        {t("module.token", { token: localVars.currentCoord, exit: localVars.finishCoord })}
      </p>
      <p className="module-feedback">{feedback}</p>
    </BaseModuleWrapper>
  );
}
