import type {
  ButtonColor,
  ButtonDirective,
  ButtonLabel,
  LightColor,
  LightState,
} from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Big Red Button module (MOD_03) — the cascading ruleset.
 *
 * Everything the module evaluates lives here as pure data:
 *   - `ACTION_RULES`       : an ordered cascade deciding HOLD vs DROP from the button's
 *                            color, label, serial parity and indicator-light state.
 *   - `LIGHT_TIMING_RULES` : when the holder of a HOLD must release, keyed by the indicator
 *                            light's color AND state. When the light is OFF the color does not
 *                            exist, so only the OFF entry applies (color is skipped).
 *
 * Edit either table to retune difficulty without touching `mod03Button.ts`.
 */

/**
 * One condition in the action cascade. A missing property is a wildcard (matches anything).
 * All defined properties must match the owner's generated state for the rule to fire.
 */
export interface ActionRuleConditions {
  buttonColor?: ButtonColor;
  buttonLabel?: ButtonLabel;
  /** Serial last digit parity. */
  serial?: "even" | "odd";
  /** Indicator-light state. */
  lightState?: LightState;
}

export interface ActionRule {
  /** Human-readable rule text shown to the Informant (Info 1). */
  text: string;
  conditions: ActionRuleConditions;
  /** What the holder must do when this rule matches. */
  directive: ButtonDirective;
}

/**
 * Info1_Baseline: the cascading ruleset. Evaluated strictly top-to-bottom; the FIRST rule
 * whose defined conditions all match decides HOLD vs DROP. The final rule is an unconditional
 * catch-all so a directive always resolves.
 *
 * (Adapted from the classic "The Button" ruleset, mapping "car/FRK indicator" to the module's
 * colored indicator light and using the shared serial parity.)
 */
export const ACTION_RULES: readonly ActionRule[] = [
  {
    text: "If the button is BLUE and says \"Abort\", press and HOLD.",
    conditions: { buttonColor: "Blue", buttonLabel: "Abort" },
    directive: "HOLD",
  },
  {
    text: "Otherwise, if the button is WHITE and the indicator light is FLASHING, press and HOLD.",
    conditions: { buttonColor: "White", lightState: "FLASHING" },
    directive: "HOLD",
  },
  {
    text: "Otherwise, if the serial number ends in an EVEN digit and the indicator light is OFF, press and HOLD.",
    conditions: { serial: "even", lightState: "OFF" },
    directive: "HOLD",
  },
  {
    text: "Otherwise, if the button is YELLOW and says \"Detonate\", press and HOLD.",
    conditions: { buttonColor: "Yellow", buttonLabel: "Detonate" },
    directive: "HOLD",
  },
  {
    text: "Otherwise, if the button is BLUE and says \"Press\", press and HOLD.",
    conditions: { buttonColor: "Blue", buttonLabel: "Press" },
    directive: "HOLD",
  },
  {
    text: "Otherwise, if the serial number ends in an ODD digit and the indicator light is SOLID, press and HOLD.",
    conditions: { serial: "odd", lightState: "SOLID" },
    directive: "HOLD",
  },
  {
    text: "Otherwise, release IMMEDIATELY without holding (DROP).",
    conditions: {},
    directive: "DROP",
  },
];

/** How the holder must release a held button. */
export type ReleaseTiming =
  | { kind: "immediate" }
  | { kind: "clockContains"; digit: number }
  | { kind: "secondsEven" };

export interface LightTimingRule {
  /** Sentence shown to the Informant (Info 2). */
  text: string;
  release: ReleaseTiming;
}

/**
 * Info2_Modifier: the release timing for a HOLD, keyed by the indicator light.
 *
 * The light has both a COLOR and a STATE. When the state is "OFF" there is no color to read,
 * so the OFF entry is a single rule that applies regardless of color. When the state is
 * "SOLID" or "FLASHING", the color selects the matching rule.
 */
export const OFF_TIMING_RULE: LightTimingRule = {
  text: "Light is OFF. Release only when the shared clock's SECONDS are even.",
  release: { kind: "secondsEven" },
};

export const LIGHT_TIMING_RULES: Record<Exclude<LightState, "OFF">, Record<LightColor, LightTimingRule>> = {
  SOLID: {
    Blue: {
      text: "Steady BLUE light. Release when the shared clock contains a 4 anywhere in MM:SS.",
      release: { kind: "clockContains", digit: 4 },
    },
    White: {
      text: "Steady WHITE light. Release when the shared clock contains a 1 anywhere in MM:SS.",
      release: { kind: "clockContains", digit: 1 },
    },
    Yellow: {
      text: "Steady YELLOW light. Release when the shared clock contains a 5 anywhere in MM:SS.",
      release: { kind: "clockContains", digit: 5 },
    },
    Red: {
      text: "Steady RED light. Release immediately once it lights — a simple tap release.",
      release: { kind: "immediate" },
    },
  },
  FLASHING: {
    Blue: {
      text: "FLASHING BLUE light. Release when the shared clock's SECONDS are even.",
      release: { kind: "secondsEven" },
    },
    White: {
      text: "FLASHING WHITE light. Release when the shared clock contains a 1 anywhere in MM:SS.",
      release: { kind: "clockContains", digit: 1 },
    },
    Yellow: {
      text: "FLASHING YELLOW light. Release when the shared clock contains a 3 anywhere in MM:SS.",
      release: { kind: "clockContains", digit: 3 },
    },
    Red: {
      text: "FLASHING RED light. Release when the shared clock contains a 7 anywhere in MM:SS.",
      release: { kind: "clockContains", digit: 7 },
    },
  },
};

/** Ordering used when rendering the Info 2 table. */
export const LIGHT_COLOR_ORDER: readonly LightColor[] = ["Red", "Blue", "White", "Yellow"];
export const LIGHT_STATE_ORDER: readonly Exclude<LightState, "OFF">[] = ["SOLID", "FLASHING"];

/** Vocabularies the generator draws from. */
export const BUTTON_COLORS: readonly ButtonColor[] = ["Red", "Blue", "White", "Yellow"];
export const BUTTON_LABELS: readonly ButtonLabel[] = ["Abort", "Detonate", "Hold", "Press"];
export const LIGHT_COLORS: readonly LightColor[] = ["Red", "Blue", "White", "Yellow"];
/** OFF is more likely than a lit state so the "skip color" path is exercised often. */
export const LIGHT_STATES: readonly LightState[] = ["OFF", "SOLID", "SOLID", "FLASHING"];

export const mod03ButtonConfig: ModuleConfig<"MOD_03_BUTTON"> = {
  id: "MOD_03_BUTTON",
  name: "Confusing Button",
  kind: "Timing Component",
  rules: {
    actionRules: ACTION_RULES,
    offTimingRule: OFF_TIMING_RULE,
    lightTimingRules: LIGHT_TIMING_RULES,
    lightColorOrder: LIGHT_COLOR_ORDER,
    lightStateOrder: LIGHT_STATE_ORDER,
    buttonColors: BUTTON_COLORS,
    buttonLabels: BUTTON_LABELS,
    lightColors: LIGHT_COLORS,
    lightStates: LIGHT_STATES,
    infoNotes: {
      info1:
        "Nowhere is the owner's button described. Ask them for the button's COLOR, LABEL, the indicator light's state (OFF, steady, or flashing), and the last digit of their serial number, then stop at the first rule that matches.",
      info2:
        "Only used if the first manual says HOLD. Ask the owner for the indicator light's COLOR and STATE. If the light is OFF, use that single row (the color does not matter).",
    },
  },
};
