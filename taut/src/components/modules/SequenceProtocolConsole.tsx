import { useState } from "react";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState, definitionById } from "../../lib/modules";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";
import { MODULE_GOALS } from "./goals";
import { useT } from "../../lib/i18n/useT";

/**
 * MOD_04_SEQUENCE_PROTOCOL — a display digit and four numbered buttons in randomised order, with
 * four stage LEDs. The owner presses a position; stages 1-2 rules live on Info 1, stages 3-4 on
 * Info 2. A wrong press resets to stage 1. Answer: `{ position }`.
 */
export function SequenceProtocolConsole({ state, disabled, submit, difficulty }: ModuleConsoleProps) {
  const t = useT();
  const { localVars } = narrowModuleState(state, "MOD_04_SEQUENCE_PROTOCOL");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const stage = Math.min(localVars.currentStage, 4);
  const display = localVars.stageDisplays[stage - 1];

  const press = async (position: number) => {
    if (disabled || pending || state.isSolved) return;
    setPending(true);
    setFeedback(null);
    try {
      const outcome = await submit({ position });
      setFeedback(outcomeMessage(outcome));
    } finally {
      setPending(false);
    }
  };

  return (
    <BaseModuleWrapper
      title={definitionById("MOD_04_SEQUENCE_PROTOCOL").name}
      isSolved={state.isSolved}
      disabled={disabled}
      strikeSignal={0}
      goal={MODULE_GOALS.MOD_04_SEQUENCE_PROTOCOL}
      showGoalHint={difficulty === "BEGINNER"}
    >
      <div className="screen">
        <span className="tag">{t("module.display")}</span>
        <div className="font-display" style={{ fontSize: 34 }}>
          {display}
        </div>
      </div>
      <div className="row" aria-label={`Stage ${stage} of 4`} style={{ gap: 6, justifyContent: "center" }}>
        {[1, 2, 3, 4].map((step) => (
          <span key={step} className={`led ${step <= stage ? "is-on" : ""}`} />
        ))}
      </div>
      <div className="pad-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {localVars.physicalLabels.map((label, index) => (
          <button
            key={`${stage}-${label}`}
            type="button"
            className="pad-btn"
            disabled={disabled || pending || state.isSolved}
            onClick={() => press(index + 1)}
          >
            <span className="font-display" style={{ fontSize: 24 }}>
              {label}
            </span>
          </button>
        ))}
      </div>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>
        {t("module.stage", { stage, total: 4 })} · {t("module.display")} {display}
      </p>
      <p className="module-feedback">{feedback}</p>
    </BaseModuleWrapper>
  );
}
