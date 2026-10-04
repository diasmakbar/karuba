import type { ValveId } from "../../types/db-schema";
import type { Rng } from "../rng";
import type { ModuleDefinition } from "./contract";
import { valveCount } from "../gameConfig";
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

export function resultingPressure(
  startPressure: number,
  active: readonly ValveId[] | undefined,
  valves: readonly ValveId[] = VALVE_IDS,
): number {
  // RTDB drops empty arrays, so `valves: []` reads back as undefined.
  void valves;
  return (active ?? []).reduce((total, valve) => total + FLOW_RATE[valve], startPressure);
}

export function toggleValve(active: readonly ValveId[] | undefined, valve: ValveId): ValveId[] {
  const current = active ?? [];
  return current.includes(valve) ? current.filter((item) => item !== valve) : [...current, valve];
}

/** True when SOME subset of `valves` (each used at most once) reaches the target from start. */
export function isSolvable(start: number, target: number, valves: readonly ValveId[]): boolean {
  const reachable = new Set<number>([start]);
  for (const valve of valves) {
    const delta = FLOW_RATE[valve];
    for (const value of [...reachable]) reachable.add(value + delta);
  }
  return reachable.has(target);
}

/** Pick a starting pressure that makes the puzzle solvable for the given valves. */
function solvableStart(rng: Rng, target: number, valves: readonly ValveId[]): number {
  const pool = rng.shuffle(START_PRESSURE_POOL);
  const found = pool.find((start) => isSolvable(start, target, valves));
  return found ?? START_PRESSURE_POOL[0];
}

export const mod10PressureValves: ModuleDefinition<"MOD_10_PRESSURE_VALVES"> = {
  config: mod10PressureValvesConfig,
  id: mod10PressureValvesConfig.id,
  name: mod10PressureValvesConfig.name,
  kind: mod10PressureValvesConfig.kind,
  generate: (rng, difficulty) => {
    const serialNumber = randomSerialNumber(rng);
    const target = targetPressure(serialNumber);
    // Difficulty shows the first N valves (4 / 6 / 8).
    const activeValves = VALVE_IDS.slice(0, valveCount(difficulty));
    const currentPressure = solvableStart(rng, target, activeValves);
    return { serialNumber, currentPressure, activeValves, valves: [] };
  },
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
    const activeValves = Array.isArray(vars.activeValves) && vars.activeValves.length > 0 ? vars.activeValves : VALVE_IDS;
    const needed = targetPressure(vars.serialNumber) - vars.currentPressure;
    return [
      {
        title: "Valve flow rates (Info 2)",
        columns: ["Valve", "Flow"],
        rows: activeValves.map((valve) => ({
          cells: [valve, `${FLOW_RATE[valve] > 0 ? "+" : ""}${FLOW_RATE[valve]} psi`],
          highlight: false,
        })),
        note: `Valves with a negative flow vent pressure. Any valve may be opened at most once; the missing pressure is ${needed} psi.`,
      },
    ];
  },
  verify: (vars, answer) =>
    resultingPressure(vars.currentPressure, answer.valves, vars.activeValves) === targetPressure(vars.serialNumber),
  status: (vars) => `Gauge reads ${resultingPressure(vars.currentPressure, vars.valves, vars.activeValves)} psi`,
};
