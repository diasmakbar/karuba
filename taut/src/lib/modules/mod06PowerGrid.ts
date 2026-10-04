import type { Switches, WarningLight } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
import { endsWithEven, randomSerialNumber } from "../rng";
import {
  ALL_OFF,
  INVERT_LABEL,
  INVERT_POSITIONS,
  SWITCH_BASELINE,
  SWITCH_COUNT,
  WARNING_LIGHTS,
  mod06PowerGridConfig,
} from "./config/mod06PowerGrid.config";

/** Info1_Baseline: the required switch pattern keyed by serial parity. */
export { SWITCH_BASELINE };

export function baselineKey(serialNumber: string): "even" | "odd" {
  return endsWithEven(serialNumber) ? "even" : "odd";
}

/** Info2_Modifier: the warning light says which positions to invert. */
export function invertPositions(warningLight: WarningLight): number[] {
  return [...INVERT_POSITIONS[warningLight]];
}

export function powerGridTarget(serialNumber: string, warningLight: WarningLight): Switches {
  const baseline = SWITCH_BASELINE[baselineKey(serialNumber)];
  const positions = invertPositions(warningLight);
  return baseline.map((state, index) => (positions.includes(index) ? !state : state)) as unknown as Switches;
}

/** Cell text for a switch state in the Info 1 table. */
function switchCell(state: boolean): string {
  return state ? "ON" : "off";
}

export const mod06PowerGrid: ModuleDefinition<"MOD_06_POWER_GRID"> = {
  config: mod06PowerGridConfig,
  id: mod06PowerGridConfig.id,
  name: mod06PowerGridConfig.name,
  kind: mod06PowerGridConfig.kind,
  generate: (rng, _difficulty) => ({
    serialNumber: randomSerialNumber(rng),
    warningLight: rng.pick(WARNING_LIGHTS),
    switches: ALL_OFF,
  }),
  info1: (vars) => [
    {
      title: "Required switch pattern (Info 1)",
      columns: ["Serial ends in", ...Array.from({ length: SWITCH_COUNT }, (_, i) => `Switch ${i + 1}`)],
      rows: [
        {
          cells: ["EVEN digit", ...SWITCH_BASELINE.even.map(switchCell)],
          highlight: baselineKey(vars.serialNumber) === "even",
        },
        {
          cells: ["ODD digit", ...SWITCH_BASELINE.odd.map(switchCell)],
          highlight: baselineKey(vars.serialNumber) === "odd",
        },
      ],
      note: "Switch 1 is the leftmost. Read all five states out loud.",
    },
  ],
  info2: (vars) => [
    {
      title: "Inversion protocol (Info 2)",
      columns: ["Warning light", "Invert these positions of the Info 1 pattern"],
      rows: WARNING_LIGHTS.map((light) => ({
        cells: [light, INVERT_LABEL[light]],
        highlight: vars.warningLight === light,
      })),
      note: "Invert means flip that switch to the opposite side of the Info 1 pattern, then the owner executes.",
    },
  ],
  verify: (vars, answer) => {
    const target = powerGridTarget(vars.serialNumber, vars.warningLight);
    return target.every((state, index) => state === answer.switches[index]);
  },
  status: (vars) => `Switches set: ${vars.switches.filter(Boolean).length} ON`,
};
