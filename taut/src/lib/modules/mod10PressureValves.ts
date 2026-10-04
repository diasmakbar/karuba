import type { ValveId } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
import { endsWithEven, randomSerialNumber } from "../rng";
import {
  FLOW_RATE,
  START_PRESSURE_POOL,
  TARGET_PRESSURE,
  VALVE_IDS,
  mod10PressureValvesConfig,
} from "./config/mod10PressureValves.config";

/** Info2_Modifier: flow rate of each valve, psi. */
export { FLOW_RATE };
export { VALVE_IDS };

/** Info1_Baseline: target pressure keyed by serial parity. */
export function targetPressure(serialNumber: string): number {
  return endsWithEven(serialNumber) ? TARGET_PRESSURE.even : TARGET_PRESSURE.odd;
}

export function resultingPressure(startPressure: number, active: readonly ValveId[] | undefined): number {
  // RTDB drops empty arrays, so `valves: []` reads back as undefined.
  return (active ?? []).reduce((total, valve) => total + FLOW_RATE[valve], startPressure);
}

export function toggleValve(active: readonly ValveId[] | undefined, valve: ValveId): ValveId[] {
  const current = active ?? [];
  return current.includes(valve) ? current.filter((item) => item !== valve) : [...current, valve];
}

export const mod10PressureValves: ModuleDefinition<"MOD_10_PRESSURE_VALVES"> = {
  config: mod10PressureValvesConfig,
  id: mod10PressureValvesConfig.id,
  name: mod10PressureValvesConfig.name,
  kind: mod10PressureValvesConfig.kind,
  generate: (rng, _difficulty) => ({
    serialNumber: randomSerialNumber(rng),
    currentPressure: rng.pick(START_PRESSURE_POOL),
    valves: [],
  }),
  info1: (vars) => [
    {
      title: "Target pressure (Info 1)",
      columns: ["Serial ends in", "Target pressure"],
      rows: [
        { cells: ["EVEN digit", `${TARGET_PRESSURE.even} psi`], highlight: endsWithEven(vars.serialNumber) },
        { cells: ["ODD digit", `${TARGET_PRESSURE.odd} psi`], highlight: !endsWithEven(vars.serialNumber) },
      ],
      note: `The gauge currently reads ${vars.currentPressure} psi — the open valves must make up the difference.`,
    },
  ],
  info2: (vars) => {
    const needed = targetPressure(vars.serialNumber) - vars.currentPressure;
    return [
      {
        title: "Valve flow rates (Info 2)",
        columns: ["Valve", "Flow"],
        rows: VALVE_IDS.map((valve) => ({
          cells: [valve, `${FLOW_RATE[valve] > 0 ? "+" : ""}${FLOW_RATE[valve]} psi`],
          highlight: false,
        })),
        note: `Valve D vents ${Math.abs(FLOW_RATE.D)} psi. Any valve may be opened at most once; the missing pressure is ${needed} psi.`,
      },
    ];
  },
  verify: (vars, answer) => resultingPressure(vars.currentPressure, answer.valves) === targetPressure(vars.serialNumber),
  status: (vars) => `Gauge reads ${resultingPressure(vars.currentPressure, vars.valves)} psi`,
};
