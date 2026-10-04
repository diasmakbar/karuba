import type { ModuleDefinition } from "./contract";
import { endsWithEven, pickDistinct, randomSerialNumber } from "../rng";
import {
  PIN_POOL,
  WIRE_COLORS,
  WIRE_COUNT_OPTIONS,
  WIRE_NOTES,
  WIRE_RULES,
  mod01WireConfig,
  type WireColor,
  type WireRuleCondition,
  type WireRuleTarget,
} from "./config/mod01Wire.config";

type WireVars = {
  serialNumber: string;
  wireCount: 3 | 4 | 5 | 6;
  wireColors: string[];
  leftPins: number[];
  rightPins: number[];
  cutIndex: number | null;
};

export { WIRE_COLORS };

/** Firebase RTDB drops empty arrays, so normalise before reading. */
function colorsOf(vars: WireVars): string[] {
  return Array.isArray(vars.wireColors) ? vars.wireColors : [];
}

function countColor(colors: string[], color: string): number {
  return colors.filter((c) => c === color).length;
}

function lastIndexOfColor(colors: string[], color: string): number {
  for (let i = colors.length - 1; i >= 0; i -= 1) {
    if (colors[i] === color) return i;
  }
  return -1;
}

/** Evaluate one config condition against the live wire set. */
function conditionMatches(condition: WireRuleCondition, colors: string[], serialOdd: boolean): boolean {
  switch (condition.kind) {
    case "countColor": {
      const count = countColor(colors, condition.color);
      return condition.op === "eq" ? count === condition.value : count > condition.value;
    }
    case "lastIs":
      return colors[colors.length - 1] === condition.color;
    case "serialOdd":
      return serialOdd;
  }
}

/** Resolve a config rule target to a concrete 0-based wire index. */
function targetIndex(target: WireRuleTarget, colors: string[]): number {
  switch (target.kind) {
    case "index":
      return target.index;
    case "last":
      return colors.length - 1;
    case "lastOfColor":
      return lastIndexOfColor(colors, target.color);
  }
}

/** True when every condition of a rule holds (an empty condition list always matches). */
function ruleMatches(rule: { conditions: readonly WireRuleCondition[] }, colors: string[], serialOdd: boolean): boolean {
  return rule.conditions.every((condition) => conditionMatches(condition, colors, serialOdd));
}

/** The wire index (0-based, top to bottom) that must be cut for this instance. */
export function wireTargetIndex(vars: WireVars): number {
  const colors = colorsOf(vars);
  const serialOdd = !endsWithEven(vars.serialNumber);
  for (const rule of WIRE_RULES[vars.wireCount]) {
    if (ruleMatches(rule, colors, serialOdd)) return targetIndex(rule.target, colors);
  }
  return 0;
}

export const mod01Wire: ModuleDefinition<"MOD_01_WIRE"> = {
  config: mod01WireConfig,
  id: mod01WireConfig.id,
  name: mod01WireConfig.name,
  kind: mod01WireConfig.kind,
  generate: (rng) => {
    const wireCount = rng.pick(WIRE_COUNT_OPTIONS);
    const wireColors = Array.from({ length: wireCount }, () => rng.pick<WireColor>(WIRE_COLORS));
    // Strictly increasing pins on both sides => no wire crossing.
    const leftPins = pickDistinct(rng, PIN_POOL, wireCount).sort((a, b) => a - b);
    const rightPins = pickDistinct(rng, PIN_POOL, wireCount).sort((a, b) => a - b);
    return {
      serialNumber: randomSerialNumber(rng),
      wireCount,
      wireColors,
      leftPins,
      rightPins,
      cutIndex: null,
    };
  },
  info1: (vars) => {
    const colors = colorsOf(vars);
    return [
      {
        title: "Wire colors (Info 1)",
        columns: ["Wire", "Color"],
        rows: colors.map((color, index) => ({
          cells: [`Wire ${index + 1}`, color],
          highlight: false,
        })),
        note: WIRE_NOTES.info1,
      },
    ];
  },
  info2: (vars) => {
    const colors = colorsOf(vars);
    const serialOdd = !endsWithEven(vars.serialNumber);
    const rules = WIRE_RULES[vars.wireCount];
    const active = rules.findIndex((rule) => ruleMatches(rule, colors, serialOdd));
    return [
      {
        title: `Cutting manual — ${vars.wireCount} wires (Info 2)`,
        columns: ["#", "Rule"],
        rows: rules.map((rule, index) => ({
          cells: [String(index + 1), rule.text],
          highlight: index === active,
        })),
        note: WIRE_NOTES.info2,
      },
    ];
  },
  verify: (vars, answer) => wireTargetIndex(vars) === answer.wireIndex,
  status: (vars) => (vars.cutIndex === null ? `Wires attached: ${vars.wireCount}` : `Wire ${vars.cutIndex + 1} cut`),
};

export type WireModuleVars = WireVars;
