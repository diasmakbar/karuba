import type { ModuleDefinition } from "./contract";
import { endsWithEven, randomSerialNumber } from "../rng";

type WireVars = { serialNumber: string; wireCount: 3 | 4; cutIndex: number | null };

const RED = "Red";
const BLUE = "Blue";
const YELLOW = "Yellow";
const WHITE_BLUE = "White with Blue stripe";
const WHITE_RED = "White with Red stripe";

/** Info1_Baseline: the color chart each wire position *should* have had. */
export function wireBaseline(serialNumber: string, wireCount: 3 | 4): string[] {
  const even = endsWithEven(serialNumber);
  if (even && wireCount === 3) return [RED, BLUE, YELLOW];
  if (even) return [RED, BLUE, WHITE_BLUE, YELLOW];
  if (wireCount === 3) return [BLUE, YELLOW, RED];
  return [YELLOW, RED, WHITE_RED, BLUE];
}

export const CUTTING_RULES = [
  "Exactly one wire in the baseline is Red → cut the LAST wire",
  "Otherwise, if more than one wire is Blue → cut the FIRST Blue wire",
  "Otherwise, if the last wire is Yellow → cut the FIRST wire",
  "Otherwise → cut the SECOND wire",
] as const;

/**
 * Info2_Modifier applied on top of Info1_Baseline. Rules are evaluated strictly in
 * order and match the exact color names of the baseline chart (striped wires are a
 * different color, so they never count as Red or Blue).
 */
export function wireTargetIndex(serialNumber: string, wireCount: 3 | 4): number {
  const baseline = wireBaseline(serialNumber, wireCount);
  const redCount = baseline.filter((color) => color === RED).length;
  if (redCount === 1) return baseline.length - 1;
  if (baseline.filter((color) => color === BLUE).length > 1) return baseline.indexOf(BLUE);
  if (baseline[baseline.length - 1] === YELLOW) return 0;
  return 1;
}

export function cuttingRuleIndex(serialNumber: string, wireCount: 3 | 4): number {
  const baseline = wireBaseline(serialNumber, wireCount);
  if (baseline.filter((color) => color === RED).length === 1) return 0;
  if (baseline.filter((color) => color === BLUE).length > 1) return 1;
  if (baseline[baseline.length - 1] === YELLOW) return 2;
  return 3;
}

export const mod01Wire: ModuleDefinition<"MOD_01_WIRE"> = {
  id: "MOD_01_WIRE",
  name: "Wire Cutters",
  kind: "Logic Component",
  generate: (rng) => ({
    serialNumber: randomSerialNumber(rng),
    wireCount: rng.pick([3, 4] as const),
    cutIndex: null,
  }),
  info1: (vars) => {
    return [
      {
        title: "Wire color chart (Info 1)",
        columns: ["Serial ends in", "Wires", "Baseline colors, left to right"],
        rows: [
          { cells: ["EVEN digit", "3", "Red · Blue · Yellow"], highlight: endsWithEven(vars.serialNumber) && vars.wireCount === 3 },
          { cells: ["EVEN digit", "4", "Red · Blue · White with Blue stripe · Yellow"], highlight: endsWithEven(vars.serialNumber) && vars.wireCount === 4 },
          { cells: ["ODD digit", "3", "Blue · Yellow · Red"], highlight: !endsWithEven(vars.serialNumber) && vars.wireCount === 3 },
          { cells: ["ODD digit", "4", "Yellow · Red · White with Red stripe · Blue"], highlight: !endsWithEven(vars.serialNumber) && vars.wireCount === 4 },
        ],
        note: `The console has ${vars.wireCount} wires. Read the highlighted baseline out loud.`,
      },
    ];
  },
  info2: (vars) => [
    {
      title: "Cutting protocol (Info 2)",
      columns: ["#", "Rule"],
      rows: CUTTING_RULES.map((rule, index) => ({
        cells: [String(index + 1), rule],
        highlight: index === cuttingRuleIndex(vars.serialNumber, vars.wireCount),
      })),
      note: "Rules are checked in order; stop at the first one that matches. Striped wires are not Red and not Blue.",
    },
  ],
  verify: (vars, answer) => wireTargetIndex(vars.serialNumber, vars.wireCount) === answer.wireIndex,
  status: (vars) => (vars.cutIndex === null ? `Wires attached: ${vars.wireCount}` : `Wire ${vars.cutIndex + 1} cut`),
};

export type WireModuleVars = WireVars;
