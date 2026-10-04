import type { ValveId } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Pressure Valves module (MOD_10).
 *
 * Flow rates, target pressures and the starting-pressure pool are data. A difficulty shows a
 * prefix of `VALVE_IDS` (4 / 6 / 8 valves). Rebalance the puzzle entirely from this file.
 */

/**
 * All valve ids, ordered. The runtime shows the first N (Beginner 4, Standard 6, Extreme 8), so
 * the first four are the classic A-D set. Valve D vents (negative flow).
 */
export const VALVE_IDS: readonly ValveId[] = ["A", "B", "C", "D", "E", "F", "G", "H"];

/** Info2_Modifier: flow rate of each valve, psi. Negative vents. */
export const FLOW_RATE: Record<ValveId, number> = {
  A: 10,
  B: 25,
  C: 15,
  D: -5,
  E: 20,
  F: -10,
  G: 5,
  H: 30,
};

/** Info1_Baseline: target pressure keyed by serial parity. */
export const TARGET_PRESSURE: Record<"even" | "odd", number> = { even: 75, odd: 90 };

/** Starting gauge readings the host may deal. */
export const START_PRESSURE_POOL = [20, 25, 30, 35, 40, 45, 50] as const;

export const mod10PressureValvesConfig: ModuleConfig<"MOD_10_PRESSURE_VALVES"> = {
  id: "MOD_10_PRESSURE_VALVES",
  name: "Pressure Valves",
  kind: "Math Component",
  rules: {
    valveIds: VALVE_IDS,
    flowRate: FLOW_RATE,
    targetPressure: TARGET_PRESSURE,
    startPressurePool: START_PRESSURE_POOL,
    infoNotes: {
      info1Template: "The gauge currently reads {current} psi — the open valves must make up the difference.",
    },
  },
};
