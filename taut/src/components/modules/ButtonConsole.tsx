import { useRef, useState } from "react";
import type { ButtonAction, ButtonColor, LightColor, LightState } from "../../types/db-schema";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState, definitionById } from "../../lib/modules";
import { clockLabel } from "../../lib/modules/mod03Button";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";

/** CSS background for the big button per its colour. */
const BUTTON_FILL: Record<ButtonColor, string> = {
  Red: "#c0392b",
  Blue: "#2b6cb0",
  White: "#e8e8e8",
  Yellow: "#d4a017",
};

/** CSS background for the indicator LED per its colour. */
const LIGHT_FILL: Record<LightColor, string> = {
  Red: "#c0392b",
  Blue: "#2b6cb0",
  White: "#e8e8e8",
  Yellow: "#d4a017",
};

/** LED class name by state: dark, steady, or blinking (lit states set the border via `is-lit`). */
const LIGHT_CLASS: Record<LightState, string> = {
  OFF: "",
  SOLID: "is-lit",
  FLASHING: "is-lit is-flashing",
};

/** Human-readable light label shown under the LED. */
const LIGHT_LABEL: Record<LightState, string> = {
  OFF: "LIGHT: OFF",
  SOLID: "LIGHT: STEADY",
  FLASHING: "LIGHT: FLASHING",
};

/**
 * MOD_03_BUTTON — a physical button with a colour, a label and a coloured indicator light.
 * The holder (owner) sees the button colour, label, the light's colour and state, and the serial;
 * the two informants must ask for them and read their manuals. The holder presses and holds; the
 * release rule keys off the SHARED room clock. Answer: `{ action, secondsLeft }`.
 */
export function ButtonConsole({ state, disabled, submit, patch, secondsLeft }: ModuleConsoleProps) {
  const { localVars } = narrowModuleState(state, "MOD_03_BUTTON");
  const [holding, setHolding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Guards against pointerUp + pointerLeave both firing a release for the same press.
  const released = useRef(false);

  const startHold = async () => {
    if (disabled || pending || state.isSolved || holding) return;
    released.current = false;
    setHolding(true);
    try {
      await patch({ ...localVars, isHolding: true, holdStartedAt: Date.now() });
    } catch {
      // Non-fatal: the hold still works locally even if the mirror write lags.
    }
  };

  const release = async (action: ButtonAction) => {
    if (disabled || pending || state.isSolved) return;
    if (released.current) return;
    released.current = true;
    setHolding(false);
    setPending(true);
    setFeedback(null);
    try {
      const outcome = await submit({ action, secondsLeft });
      setFeedback(outcomeMessage(outcome));
      await patch({ ...localVars, isHolding: false, holdStartedAt: null });
    } finally {
      setPending(false);
    }
  };

  const clock = clockLabel(secondsLeft);

  return (
    <BaseModuleWrapper
      title={definitionById("MOD_03_BUTTON").name}
      isSolved={state.isSolved}
      disabled={disabled}
      strikeSignal={0}
    >
      <div className="serial">SN {localVars.serialNumber}</div>
      <div className="screen">
        <span className="tag">Shared clock</span>
        <div className="font-display" style={{ fontSize: 40 }}>
          {clock}
        </div>
        <div className="row" style={{ gap: 8, alignItems: "center", justifyContent: "center" }}>
          <span
            className={`led ${LIGHT_CLASS[localVars.lightState]}`.trim()}
            style={
              localVars.lightState === "OFF"
                ? undefined
                : { background: LIGHT_FILL[localVars.lightColor], color: LIGHT_FILL[localVars.lightColor] }
            }
            aria-label={LIGHT_LABEL[localVars.lightState]}
          />
          <span className="tag">{LIGHT_LABEL[localVars.lightState]}</span>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-block"
        style={{
          background: BUTTON_FILL[localVars.buttonColor],
          color: localVars.buttonColor === "White" || localVars.buttonColor === "Yellow" ? "#111" : "#fff",
          fontWeight: 700,
        }}
        disabled={disabled || pending || state.isSolved}
        aria-pressed={holding}
        onPointerDown={startHold}
        onPointerUp={() => release("HOLD_TO_TARGET")}
        onPointerLeave={() => (holding ? release("HOLD_TO_TARGET") : undefined)}
      >
        {holding ? "RELEASE" : localVars.buttonLabel.toUpperCase()}
      </button>

      <button
        type="button"
        className="btn btn-ghost btn-block"
        disabled={disabled || pending || state.isSolved || holding}
        onClick={() => release("RELEASE_NOW")}
      >
        Tap release now
      </button>
      <p className="module-feedback">{feedback}</p>
    </BaseModuleWrapper>
  );
}
