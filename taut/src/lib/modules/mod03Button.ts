import type { ButtonDirective, StripColor } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
import { endsWithEven, randomSerialNumber } from "../rng";
import {
  ACTION_RULES,
  BUTTON_COLORS,
  BUTTON_LABELS,
  STRIP_COLORS,
  STRIP_ORDER,
  STRIP_TIMING_RULES,
  mod03ButtonConfig,
  type ActionRuleConditions,
  type StripRelease,
} from "./config/mod03Button.config";

/* ------------------------------------------------------------------ *
 * Shared clock helpers (also used by the owner console)
 * ------------------------------------------------------------------ */

/** The MM:SS the room clock shows for a given number of seconds left. */
export function clockLabel(secondsLeft: number): string {
  const total = Math.max(0, Math.floor(secondsLeft));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/** "Contains N" — the digit N appears anywhere in the displayed MM:SS. */
export function clockContains(secondsLeft: number, digit: number): boolean {
  return clockLabel(secondsLeft).includes(String(digit));
}

/** The seconds part of the clock is even (spec: "release on even seconds"). */
export function secondsAreEven(secondsLeft: number): boolean {
  return Math.max(0, Math.floor(secondsLeft)) % 2 === 0;
}

/* ------------------------------------------------------------------ *
 * Cascading rule evaluation
 * ------------------------------------------------------------------ */

/** The subset of local vars the cascade reads (the button's identity). */
export interface ButtonIdentity {
  buttonColor: string;
  buttonLabel: string;
  stripColor: StripColor;
  flashingLight: boolean;
  serialNumber: string;
}

/**
 * True when every DEFINED condition property matches the owner's state. A property that is
 * `undefined` in the rule is treated as a wildcard and always matches.
 */
export function actionRuleMatches(conditions: ActionRuleConditions, vars: ButtonIdentity): boolean {
  if (conditions.buttonColor !== undefined && conditions.buttonColor !== vars.buttonColor) return false;
  if (conditions.buttonLabel !== undefined && conditions.buttonLabel !== vars.buttonLabel) return false;
  if (conditions.flashingLight !== undefined && conditions.flashingLight !== vars.flashingLight) return false;
  if (conditions.serial !== undefined) {
    const parity = endsWithEven(vars.serialNumber) ? "even" : "odd";
    if (conditions.serial !== parity) return false;
  }
  return true;
}

/**
 * Resolve the correct directive by walking `ACTION_RULES` top-to-bottom and returning the first
 * rule whose defined conditions all match. A final catch-all guarantees a result, but we still
 * fall back to DROP defensively.
 */
export function resolveDirective(vars: ButtonIdentity): ButtonDirective {
  for (const rule of ACTION_RULES) {
    if (actionRuleMatches(rule.conditions, vars)) return rule.directive;
  }
  return "DROP";
}

/* ------------------------------------------------------------------ *
 * Release-timing evaluation
 * ------------------------------------------------------------------ */

/** Evaluate a strip-color release requirement against the holder's release attempt. */
export function releaseSatisfied(
  release: StripRelease,
  action: "RELEASE_NOW" | "HOLD_TO_TARGET",
  secondsLeft: number,
): boolean {
  switch (release.kind) {
    case "immediate":
      return action === "RELEASE_NOW";
    case "secondsEven":
      return action === "RELEASE_NOW" && secondsAreEven(secondsLeft);
    case "clockContains":
      return action === "HOLD_TO_TARGET" && clockContains(secondsLeft, release.digit);
  }
}

/* ------------------------------------------------------------------ *
 * Module definition
 * ------------------------------------------------------------------ */

export const mod03Button: ModuleDefinition<"MOD_03_BUTTON"> = {
  config: mod03ButtonConfig,
  id: mod03ButtonConfig.id,
  name: mod03ButtonConfig.name,
  kind: mod03ButtonConfig.kind,
  generate: (rng) => ({
    buttonColor: rng.pick(BUTTON_COLORS),
    buttonLabel: rng.pick(BUTTON_LABELS),
    stripColor: rng.pick(STRIP_COLORS),
    flashingLight: rng.bool(),
    serialNumber: randomSerialNumber(rng),
    isHolding: false,
    holdStartedAt: null,
  }),
  // Info 1: the ordered action cascade. No row is highlighted — the Informant must ask the
  // owner for the color, label, light and serial parity, then stop at the first matching rule.
  info1: () => [
    {
      title: "Action cascade — check top to bottom (Info 1)",
      columns: ["#", "Rule"],
      rows: ACTION_RULES.map((rule, index) => ({
        cells: [String(index + 1), rule.text],
        highlight: false,
      })),
      note: "Stop at the first rule that matches. If it says HOLD, consult the release manual. If it says DROP, release immediately.",
    },
  ],
  // Info 2: the strip-color release table. Again, no highlighting — the Informant asks the owner
  // for the strip color beside the button.
  info2: () => [
    {
      title: "Release timing by strip color (Info 2)",
      columns: ["Strip color", "Release when…"],
      rows: STRIP_ORDER.map((strip) => ({
        cells: [strip, STRIP_TIMING_RULES[strip].text],
        highlight: false,
      })),
      note: "Only read this if the first manual resolved to HOLD. Everyone reads the same shared room clock.",
    },
  ],
  verify: (vars, answer) => {
    const directive = resolveDirective(vars);
    // A wrong action (e.g. holding when told to DROP, or an early release) is a strike.
    if (answer.action === "EARLY") return false;
    if (directive === "DROP") return answer.action === "RELEASE_NOW";
    // HOLD: validate the release time against the strip-color requirement.
    return releaseSatisfied(STRIP_TIMING_RULES[vars.stripColor].release, answer.action, answer.secondsLeft);
  },
  status: (vars) => (vars.isHolding ? "Holding — release per your informant" : "Idle — press and hold"),
};
