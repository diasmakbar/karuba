import type { Switches, WarningLight } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
import { endsWithEven, randomSerialNumber } from "../rng";

const ALL_OFF: Switches = [false, false, false, false, false];

/** Info1_Baseline: the required switch pattern keyed by serial parity. */
export const SWITCH_BASELINE: Record<"even" | "odd", Switches> = {
  even: [true, false, true, false, false],
  odd: [false, true, false, true, true],
};

export function baselineKey(serialNumber: string): "even" | "odd" {
  return endsWithEven(serialNumber) ? "even" : "odd";
}

/** Info2_Modifier: the warning light says which positions to invert. */
export function invertPositions(warningLight: WarningLight): number[] {
  return warningLight === "FLASHING" ? [1, 3] : [0, 4];
}

export function powerGridTarget(serialNumber: string, warningLight: WarningLight): Switches {
  const baseline = SWITCH_BASELINE[baselineKey(serialNumber)];
  const positions = invertPositions(warningLight);
  return baseline.map((state, index) => (positions.includes(index) ? !state : state)) as unknown as Switches;
}

export const mod06PowerGrid: ModuleDefinition<"MOD_06_POWER_GRID"> = {
  id: "MOD_06_POWER_GRID",
  name: "Power Grid",
  kind: "Puzzle Component",
  generate: (rng) => ({
    serialNumber: randomSerialNumber(rng),
    warningLight: rng.pick(["FLASHING", "SOLID"] as const),
    switches: ALL_OFF,
  }),
  info1: (vars) => [
    {
      title: "Required switch pattern (Info 1)",
      columns: ["Serial ends in", "Switch 1", "Switch 2", "Switch 3", "Switch 4", "Switch 5"],
      rows: [
        { cells: ["EVEN digit", "ON", "off", "ON", "off", "off"], highlight: baselineKey(vars.serialNumber) === "even" },
        { cells: ["ODD digit", "off", "ON", "off", "ON", "ON"], highlight: baselineKey(vars.serialNumber) === "odd" },
      ],
      note: "Switch 1 is the leftmost. Read all five states out loud.",
    },
  ],
  info2: (vars) => [
    {
      title: "Inversion protocol (Info 2)",
      columns: ["Warning light", "Invert these positions of the Info 1 pattern"],
      rows: [
        { cells: ["FLASHING", "Switch 2 and Switch 4"], highlight: vars.warningLight === "FLASHING" },
        { cells: ["SOLID", "Switch 1 and Switch 5"], highlight: vars.warningLight === "SOLID" },
      ],
      note: "Invert means flip that switch to the opposite side of the Info 1 pattern, then the owner executes.",
    },
  ],
  verify: (vars, answer) => {
    const target = powerGridTarget(vars.serialNumber, vars.warningLight);
    return target.every((state, index) => state === answer.switches[index]);
  },
  status: (vars) => `Switches set: ${vars.switches.filter(Boolean).length} ON`,
};
