import { useState } from "react";
import type { VialId } from "../../types/db-schema";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState, definitionById } from "../../lib/modules";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";
import { MODULE_GOALS } from "./goals";
import { useT } from "../../lib/i18n/useT";

/**
 * MOD_09_SYNTHESIZER — a target type plus the dealt vials. Info 1 lists the target's pH/temp
 * requirements; Info 2 maps each vial to a pH/temp. Answer: `{ vial }`.
 *
 * The vial buttons come from the per-instance `vialIds` dealt at generate time (5/10 by
 * difficulty); never a hard-coded list, so the answer is always an actual option.
 */
export function SynthesizerConsole({ state, disabled, submit, difficulty }: ModuleConsoleProps) {
  const t = useT();
  const { localVars } = narrowModuleState(state, "MOD_09_SYNTHESIZER");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // RTDB drops empty arrays; fall back to a small default if the dealt list ever goes missing.
  const vials: VialId[] = Array.isArray(localVars.vialIds) && localVars.vialIds.length > 0
    ? (localVars.vialIds as VialId[])
    : ["Alpha", "Beta", "Gamma", "Delta"];

  const pick = async (vial: VialId) => {
    if (disabled || pending || state.isSolved) return;
    setPending(true);
    setFeedback(null);
    try {
      const outcome = await submit({ vial });
      setFeedback(outcomeMessage(outcome));
    } finally {
      setPending(false);
    }
  };

  return (
    <BaseModuleWrapper
      title={definitionById("MOD_09_SYNTHESIZER").name}
      isSolved={state.isSolved}
      disabled={disabled}
      strikeSignal={0}
      goal={MODULE_GOALS.MOD_09_SYNTHESIZER}
      showGoalHint={difficulty === "BEGINNER"}
    >
      <div className="screen">
        <span className="tag">{t("module.target")}</span>
        <div className="font-display">{localVars.targetType}</div>
      </div>
      <div className="pad-grid">
        {vials.map((vial) => (
          <button
            key={vial}
            type="button"
            className="pad-btn"
            disabled={disabled || pending || state.isSolved}
            onClick={() => pick(vial)}
          >
            {vial}
          </button>
        ))}
      </div>
      <p className="module-feedback">{feedback}</p>
    </BaseModuleWrapper>
  );
}
