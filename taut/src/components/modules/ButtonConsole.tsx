import { useRef, useState } from "react";
import type { ButtonAction, ButtonColor, LightColor, LightState } from "../../types/db-schema";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState, definitionById } from "../../lib/modules";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";
import { MODULE_GOALS } from "./goals";

/** CSS background for the big button per its colour. White is intentionally not used. */
const BUTTON_FILL: Record<ButtonColor, string> = {
  Red: "#c0392b",
  Blue: "#2b6cb0",
  Green: "#2e9e5b",
  Yellow: "#d4a017",
};

/** CSS background for the indicator LED per its colour. White is intentionally not used. */
const LIGHT_FILL: Record<LightColor, string> = {
  Red: "#c0392b",
  Blue: "#2b6cb0",
  Green: "#2e9e5b",
  Yellow: "#d4a017",
};

/** LED class name by state: dark, lit, or blinking (lit states set the border via `is-lit`). */
const LIGHT_CLASS: Record<LightState, string> = {
  OFF: "",
  SOLID: "is-lit",
  FLASHING: "is-lit is-flashing",
};

/** A press shorter than this is treated as a click-release; longer is a hold. */
const HOLD_THRESHOLD_MS = 1000;

/**
 * MOD_03_BUTTON — a physical button with a colour, a label and a coloured indicator light.
 * The holder (owner) sees the button colour, label, the light's colour and state, and the serial;
 * the two informants must ask for them and read their manuals.
 *
 * Press semantics are measured locally: hold the button for under a second and release => a
 * click-release (`RELEASE_NOW`); hold for a second or longer => a hold release (`HOLD_TO_TARGET`).
 * The release's timing (validated against the light state/colour) is decided by the module.
 * Answer: `{ action, secondsLeft }`.
 */
export function ButtonConsole({ state, disabled, submit, patch, secondsLeft, difficulty }: ModuleConsoleProps) {
  const { localVars } = narrowModuleState(state, "MOD_03_BUTTON");
  const [holding, setHolding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Guards against pointerUp + pointerLeave both firing a release for the same press.
  const released = useRef(false);
  // Timestamp of the current press, used to classify it as a click or a hold on release.
  const pressedAt = useRef<number | null>(null);

  const startHold = async () => {
    if (disabled || pending || state.isSolved || holding) return;
    released.current = false;
    pressedAt.current = Date.now();
    setHolding(true);
    try {
      await patch({ ...localVars, isHolding: true, holdStartedAt: Date.now() });
    } catch {
      // Non-fatal: the hold still works locally even if the mirror write lags.
    }
  };

  const release = async () => {
    if (disabled || pending || state.isSolved) return;
    if (released.current) return;
    released.current = true;
    // Elapsed time classifies the press: short = click-release, long = hold-to-target.
    const elapsed = pressedAt.current === null ? 0 : Date.now() - pressedAt.current;
    pressedAt.current = null;
    const action: ButtonAction = elapsed < HOLD_THRESHOLD_MS ? "RELEASE_NOW" : "HOLD_TO_TARGET";
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

  return (
    <BaseModuleWrapper
      title={definitionById("MOD_03_BUTTON").name}
      isSolved={state.isSolved}
      disabled={disabled}
      strikeSignal={0}
      goal={MODULE_GOALS.MOD_03_BUTTON}
      showGoalHint={difficulty === "BEGINNER"}
    >
      <div className="serial">SN {localVars.serialNumber}</div>

      <div className="row" style={{ alignItems: "center", justifyContent: "center", gap: 16, marginTop: 8 }}>
        <button
          type="button"
          className="btn btn-block"
          style={{
            background: BUTTON_FILL[localVars.buttonColor],
            color: localVars.buttonColor === "Yellow" ? "#111" : "#fff",
            fontWeight: 700,
            flex: 1,
          }}
          disabled={disabled || pending || state.isSolved}
          aria-pressed={holding}
          onPointerDown={startHold}
          onPointerUp={release}
          onPointerLeave={() => (holding ? release() : undefined)}
        >
          {holding ? "RELEASE" : localVars.buttonLabel.toUpperCase()}
        </button>

        <div
          className={`led led-lg ${LIGHT_CLASS[localVars.lightState]}`.trim()}
          style={
            localVars.lightState === "OFF"
              ? undefined
              : { background: LIGHT_FILL[localVars.lightColor], color: LIGHT_FILL[localVars.lightColor] }
          }
          aria-label={`Indicator light ${localVars.lightState.toLowerCase()}`}
        />
      </div>
      <p className="module-feedback">{feedback}</p>
    </BaseModuleWrapper>
  );
}
