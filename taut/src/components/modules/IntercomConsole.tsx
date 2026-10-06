import { useState } from "react";
import type { IntercomMessage } from "../../types/db-schema";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState, definitionById } from "../../lib/modules";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";
import { MODULE_GOALS } from "./goals";
import { useT } from "../../lib/i18n/useT";

/** MOD_11 owner console: choose the final message after the Info 1 → Info 2 → Info 1 chain. */
export function IntercomConsole({ state, disabled, submit, difficulty }: ModuleConsoleProps) {
  const t = useT();
  const { localVars } = narrowModuleState(state, "MOD_11_INTERCOM");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const choices: IntercomMessage[] = Array.isArray(localVars.messages) && localVars.messages.length > 0
    ? localVars.messages
    : ["KOSONG", "APA", "TUNGGU", "BENTAR"];

  const choose = async (message: IntercomMessage) => {
    if (disabled || pending || state.isSolved) return;
    setPending(true);
    setFeedback(null);
    try {
      setFeedback(outcomeMessage(await submit({ message })));
    } finally {
      setPending(false);
    }
  };

  return (
    <BaseModuleWrapper
      title={definitionById("MOD_11_INTERCOM").name}
      isSolved={state.isSolved}
      disabled={disabled}
      strikeSignal={0}
      goal={MODULE_GOALS.MOD_11_INTERCOM}
      showGoalHint={difficulty === "BEGINNER"}
    >
      <div className="screen">
        <span className="tag">{t("module.incoming")}</span>
        <div className="font-display">{localVars.incomingMessage}</div>
      </div>
      <div className="pad-grid">
        {choices.map((message) => (
          <button
            key={message}
            type="button"
            className="pad-btn"
            disabled={disabled || pending || state.isSolved}
            onClick={() => choose(message)}
          >
            {message}
          </button>
        ))}
      </div>
      <p className="module-feedback">{feedback}</p>
    </BaseModuleWrapper>
  );
}
