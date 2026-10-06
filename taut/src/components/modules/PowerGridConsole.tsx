import { useState } from "react";
import type { Switches } from "../../types/db-schema";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState, definitionById } from "../../lib/modules";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";
import { useT } from "../../lib/i18n/useT";
import { MODULE_GOALS } from "./goals";

/**
 * MOD_06_POWER_GRID — five unlabelled switches, a serial and a warning light. Info 1 gives the
 * base pattern for the serial; Info 2 says which switches the light toggles. Answer: `{ switches }`.
 */
export function PowerGridConsole({ state, disabled, submit, difficulty }: ModuleConsoleProps) {
  const t = useT();
  const { localVars } = narrowModuleState(state, "MOD_06_POWER_GRID");
  const [switches, setSwitches] = useState<boolean[]>([false, false, false, false, false]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const toggle = (index: number) => {
    if (disabled || pending || state.isSolved) return;
    setSwitches((current) => current.map((value, i) => (i === index ? !value : value)));
  };

  const confirm = async () => {
    if (disabled || pending || state.isSolved) return;
    setPending(true);
    setFeedback(null);
    try {
      const outcome = await submit({ switches: switches as unknown as Switches });
      setFeedback(outcomeMessage(outcome));
    } finally {
      setPending(false);
    }
  };

  return (
    <BaseModuleWrapper
      title={definitionById("MOD_06_POWER_GRID").name}
      isSolved={state.isSolved}
      disabled={disabled}
      strikeSignal={0}
      goal={MODULE_GOALS.MOD_06_POWER_GRID}
      showGoalHint={difficulty === "BEGINNER"}
    >
      <div className="screen">
        <span className="tag">{t("module.warningLight")}</span>
        <div className={`led ${localVars.warningLight === "FLASHING" ? "is-flashing" : "is-on"}`} />
        <div className="serial">{t("module.serial")} {localVars.serialNumber}</div>
      </div>
      <div className="switches">
        {switches.map((value, index) => (
          <button
            key={index}
            type="button"
            className={`toggle ${value ? "is-on" : ""}`}
            disabled={disabled || pending || state.isSolved}
            onClick={() => toggle(index)}
            aria-label={`Switch ${index + 1} ${value ? "on" : "off"}`}
          >
            {value ? t("module.switchOn") : t("module.switchOff")}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-block"
        disabled={disabled || pending || state.isSolved}
        onClick={confirm}
      >
        {t("module.execute")}
      </button>
      <p className="module-feedback">{feedback}</p>
    </BaseModuleWrapper>
  );
}
