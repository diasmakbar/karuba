import type { ModuleDefinition } from "./contract";
import { endsWithEven, pickDistinct, randomSerialNumber } from "../rng";

type WireVars = {
  serialNumber: string;
  wireCount: 3 | 4 | 5 | 6;
  wireColors: string[];
  leftPins: number[];
  rightPins: number[];
  cutIndex: number | null;
};

const RED = "Red";
const WHITE = "White";
const BLUE = "Blue";
const YELLOW = "Yellow";
const BLACK = "Black";

/** Every wire color is drawn from this pool, regardless of wire count. */
export const WIRE_COLORS = [RED, WHITE, BLUE, YELLOW, BLACK] as const;

/** Left pins A1..A6 and right pins B1..B6; strictly increasing assignments on both
 * sides guarantee no wire crossing. */
const PIN_POOL = [1, 2, 3, 4, 5, 6] as const;

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

type WireRule = {
  text: string;
  matches: (colors: string[], serialOdd: boolean) => boolean;
  target: (colors: string[]) => number;
};

/**
 * Info2_Manual: the cutting rules for each wire count. Rules are evaluated strictly
 * in order and the first match wins; the final rule of every set always matches, so
 * a target always exists.
 */
const WIRE_RULES: Record<WireVars["wireCount"], readonly WireRule[]> = {
  3: [
    {
      text: "If there are no red wires, cut the second wire.",
      matches: (colors) => countColor(colors, RED) === 0,
      target: () => 1,
    },
    {
      text: "Otherwise, if the last wire is white, cut the last wire.",
      matches: (colors) => colors[colors.length - 1] === WHITE,
      target: (colors) => colors.length - 1,
    },
    {
      text: "Otherwise, if there is more than one blue wire, cut the last blue wire.",
      matches: (colors) => countColor(colors, BLUE) > 1,
      target: (colors) => lastIndexOfColor(colors, BLUE),
    },
    {
      text: "Otherwise, cut the last wire.",
      matches: () => true,
      target: (colors) => colors.length - 1,
    },
  ],
  4: [
    {
      text: "If there is more than one red wire and the last digit of the serial number is odd, cut the last red wire.",
      matches: (colors, serialOdd) => countColor(colors, RED) > 1 && serialOdd,
      target: (colors) => lastIndexOfColor(colors, RED),
    },
    {
      text: "Otherwise, if the last wire is yellow and there are no red wires, cut the first wire.",
      matches: (colors) => colors[colors.length - 1] === YELLOW && countColor(colors, RED) === 0,
      target: () => 0,
    },
    {
      text: "Otherwise, if there is exactly one blue wire, cut the first wire.",
      matches: (colors) => countColor(colors, BLUE) === 1,
      target: () => 0,
    },
    {
      text: "Otherwise, if there is more than one yellow wire, cut the last wire.",
      matches: (colors) => countColor(colors, YELLOW) > 1,
      target: (colors) => colors.length - 1,
    },
    {
      text: "Otherwise, cut the second wire.",
      matches: () => true,
      target: () => 1,
    },
  ],
  5: [
    {
      text: "If the last wire is black and the last digit of the serial number is odd, cut the fourth wire.",
      matches: (colors, serialOdd) => colors[colors.length - 1] === BLACK && serialOdd,
      target: () => 3,
    },
    {
      text: "Otherwise, if there is exactly one red wire and there is more than one yellow wire, cut the first wire.",
      matches: (colors) => countColor(colors, RED) === 1 && countColor(colors, YELLOW) > 1,
      target: () => 0,
    },
    {
      text: "Otherwise, if there are no black wires, cut the second wire.",
      matches: (colors) => countColor(colors, BLACK) === 0,
      target: () => 1,
    },
    {
      text: "Otherwise, cut the first wire.",
      matches: () => true,
      target: () => 0,
    },
  ],
  6: [
    {
      text: "If there are no yellow wires and the last digit of the serial number is odd, cut the third wire.",
      matches: (colors, serialOdd) => countColor(colors, YELLOW) === 0 && serialOdd,
      target: () => 2,
    },
    {
      text: "Otherwise, if there is exactly one yellow wire and there is more than one white wire, cut the fourth wire.",
      matches: (colors) => countColor(colors, YELLOW) === 1 && countColor(colors, WHITE) > 1,
      target: () => 3,
    },
    {
      text: "Otherwise, if there are no red wires, cut the last wire.",
      matches: (colors) => countColor(colors, RED) === 0,
      target: (colors) => colors.length - 1,
    },
    {
      text: "Otherwise, cut the fourth wire.",
      matches: () => true,
      target: () => 3,
    },
  ],
};

/** The wire index (0-based, top to bottom) that must be cut for this instance. */
export function wireTargetIndex(vars: WireVars): number {
  const colors = colorsOf(vars);
  const serialOdd = !endsWithEven(vars.serialNumber);
  for (const rule of WIRE_RULES[vars.wireCount]) {
    if (rule.matches(colors, serialOdd)) return rule.target(colors);
  }
  return 0;
}

export const mod01Wire: ModuleDefinition<"MOD_01_WIRE"> = {
  id: "MOD_01_WIRE",
  name: "Wire Cutters",
  kind: "Logic Component",
  generate: (rng) => {
    const wireCount = rng.pick([3, 4, 5, 6] as const);
    const wireColors = Array.from({ length: wireCount }, () => rng.pick(WIRE_COLORS));
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
        note: "Wires are listed top to bottom. Read every color out loud.",
      },
    ];
  },
  info2: (vars) => {
    const colors = colorsOf(vars);
    const serialOdd = !endsWithEven(vars.serialNumber);
    const rules = WIRE_RULES[vars.wireCount];
    const active = rules.findIndex((rule) => rule.matches(colors, serialOdd));
    return [
      {
        title: `Cutting manual — ${vars.wireCount} wires (Info 2)`,
        columns: ["#", "Rule"],
        rows: rules.map((rule, index) => ({
          cells: [String(index + 1), rule.text],
          highlight: index === active,
        })),
        note: "Rules are checked in order; stop at the first one that matches. 'Last digit' refers to the serial number.",
      },
    ];
  },
  verify: (vars, answer) => wireTargetIndex(vars) === answer.wireIndex,
  status: (vars) => (vars.cutIndex === null ? `Wires attached: ${vars.wireCount}` : `Wire ${vars.cutIndex + 1} cut`),
};

export type WireModuleVars = WireVars;
