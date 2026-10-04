import type { ButtonColor, ButtonDirective, ButtonLabel, StripColor } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Big Red Button module (MOD_03) — the cascading ruleset.
 *
 * Everything the module evaluates lives here as pure data:
 *   - `ACTION_RULES`       : an ordered cascade deciding HOLD vs DROP from the button's
 *                            color, label, serial parity and flashing light.
 *   - `STRIP_TIMING_RULES` : when the holder of a HOLD must release, keyed by strip color.
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
  flashingLight?: boolean;
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
 * "flashing light" and using the shared serial parity.)
 */
export const ACTION_RULES: readonly ActionRule[] = [
  {
    text: "If the button is BLUE and says \"Abort\", press and HOLD.",
    conditions: { buttonColor: "Blue", buttonLabel: "Abort" },
    directive: "HOLD",
  },
  {
    text: "Otherwise, if the button is WHITE and the flashing light is ON, press and HOLD.",
    conditions: { buttonColor: "White", flashingLight: true },
    directive: "HOLD",
  },
  {
    text: "Otherwise, if the serial number ends in an EVEN digit and the flashing light is OFF, press and HOLD.",
    conditions: { serial: "even", flashingLight: false },
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
    text: "Otherwise, if the serial number ends in an ODD digit and the flashing light is ON, press and HOLD.",
    conditions: { serial: "odd", flashingLight: true },
    directive: "HOLD",
  },
  {
    text: "Otherwise, release IMMEDIATELY without holding (DROP).",
    conditions: {},
    directive: "DROP",
  },
];

/** How the holder must release a held button. */
export type StripRelease =
  | { kind: "immediate" }
  | { kind: "clockContains"; digit: number }
  | { kind: "secondsEven" };

export interface StripTimingRule {
  /** Sentence shown to the Informant (Info 2). */
  text: string;
  release: StripRelease;
}

/**
 * Info2_Modifier: the release timing for a HOLD, keyed by the strip color on the button's side.
 * (Classic "The Button" release table.)
 */
export const STRIP_TIMING_RULES: Record<StripColor, StripTimingRule> = {
  Blue: {
    text: "Release when the shared clock contains a 4 anywhere in MM:SS.",
    release: { kind: "clockContains", digit: 4 },
  },
  White: {
    text: "Release when the shared clock contains a 1 anywhere in MM:SS.",
    release: { kind: "clockContains", digit: 1 },
  },
  Yellow: {
    text: "Release when the shared clock contains a 5 anywhere in MM:SS.",
    release: { kind: "clockContains", digit: 5 },
  },
  Red: {
    text: "Release when the shared clock's SECONDS are even.",
    release: { kind: "secondsEven" },
  },
};

/** Ordering used when rendering the Info 2 table. */
export const STRIP_ORDER: readonly StripColor[] = ["Blue", "White", "Yellow", "Red"];

/** Vocabularies the generator draws from. */
export const BUTTON_COLORS: readonly ButtonColor[] = ["Red", "Blue", "White", "Yellow"];
export const BUTTON_LABELS: readonly ButtonLabel[] = ["Abort", "Detonate", "Hold", "Press"];
export const STRIP_COLORS: readonly StripColor[] = ["Red", "Blue", "White", "Yellow"];

export const mod03ButtonConfig: ModuleConfig<"MOD_03_BUTTON"> = {
  id: "MOD_03_BUTTON",
  name: "Big Red Button",
  kind: "Timing Component",
  rules: {
    actionRules: ACTION_RULES,
    stripTimingRules: STRIP_TIMING_RULES,
    stripOrder: STRIP_ORDER,
    buttonColors: BUTTON_COLORS,
    buttonLabels: BUTTON_LABELS,
    stripColors: STRIP_COLORS,
    infoNotes: {
      info1:
        "Nowhere is the owner's button described. Ask them for the button's COLOR, LABEL, the flashing light, and the last digit of their serial number, then stop at the first rule that matches.",
      info2:
        "Only used if the first manual says HOLD. Ask the owner for the STRIP COLOR beside the button, then read the matching release timing.",
    },
  },
};
