import { useState } from "react";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState, definitionById } from "../../lib/modules";
import { GRID_COLUMNS } from "../../lib/rng";
import { useT } from "../../lib/i18n/useT";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";
import { MODULE_GOALS } from "./goals";

/** Owner console: show target/shot identifiers and an empty coordinate grid only. */
export function BattleshipConsole({ state, disabled, submit, difficulty }: ModuleConsoleProps) {
  const t = useT();
  const { localVars } = narrowModuleState(state, "MOD_12_BATTLESHIP");
  const columns = GRID_COLUMNS.slice(0, localVars.gridSize);
  const rows = columns.map((_column, index) => index + 1);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const confirm = async () => {
    if (disabled || pending || state.isSolved || !selected) return;
    setPending(true);
    setFeedback(null);
    try {
      setFeedback(outcomeMessage(await submit({ coord: selected })));
    } finally {
      setPending(false);
    }
  };

  return (
    <BaseModuleWrapper
      title={definitionById("MOD_12_BATTLESHIP").name}
      isSolved={state.isSolved}
      disabled={disabled}
      strikeSignal={0}
      goal={MODULE_GOALS.MOD_12_BATTLESHIP}
      showGoalHint={difficulty === "BEGINNER"}
    >
      <div className="screen">
        <span className="tag">{t("module.target")}</span>
        <div className="font-display">{localVars.targetShip}</div>
        <span className="tag">{t("module.incoming")}</span>
        <div className="font-display">{localVars.incomingShot}</div>
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
                aria-label={`${t("module.select")} ${coord}`}
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
        {selected ? t("module.confirm", { value: selected }) : t("module.select")}
      </button>
      <p className="module-feedback">{feedback}</p>
    </BaseModuleWrapper>
  );
}
