import type { Constellation, WindDirection } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
import { clampIndex, coordFrom, parseCoord } from "../rng";

/** Info1_Baseline: the storm epicenter for each constellation. */
export const EPICENTER: Record<Constellation, string> = {
  Ursa: "C3",
  Orion: "A5",
  Draco: "E1",
};

/** Info2_Modifier: how the reading drifts off the epicenter. */
const DRIFT_DELTA: Record<WindDirection, [number, number]> = {
  North: [-1, -1],
  East: [2, -1],
  South: [0, 2],
};

export const DRIFT_RULE: Record<WindDirection, string> = {
  North: "Drift 1 column left and 1 row up.",
  East: "Drift 2 columns right and 1 row up.",
  South: "Drift 2 rows down.",
};

/**
 * Clamping models the radar edge: a shift that would leave the 5x5 grid simply stops
 * on that axis, so the target always stays on screen.
 */
export function radarTarget(vars: { constellation: Constellation; windDirection: WindDirection }): string {
  const start = parseCoord(EPICENTER[vars.constellation]);
  const [dx, dy] = DRIFT_DELTA[vars.windDirection];
  return coordFrom(clampIndex(start.col + dx, 5), clampIndex(start.row + dy, 5));
}

export const mod08Radar: ModuleDefinition<"MOD_08_RADAR"> = {
  id: "MOD_08_RADAR",
  name: "Storm Radar",
  kind: "Spatial Component",
  generate: (rng) => ({
    constellation: rng.pick(["Ursa", "Orion", "Draco"] as const),
    windDirection: rng.pick(["North", "East", "South"] as const),
  }),
  info1: (vars) => [
    {
      title: "Epicenter chart (Info 1)",
      columns: ["Constellation on screen", "Epicenter"],
      rows: (["Ursa", "Orion", "Draco"] as const).map((item) => ({
        cells: [item, EPICENTER[item]],
        highlight: item === vars.constellation,
      })),
      note: "Columns are A-E left to right, rows are 1-5 top to bottom.",
    },
  ],
  info2: (vars) => [
    {
      title: "Drift pattern (Info 2)",
      columns: ["Wind arrow", "Drift from the epicenter"],
      rows: (["North", "East", "South"] as const).map((wind) => ({
        cells: [wind, DRIFT_RULE[wind]],
        highlight: wind === vars.windDirection,
      })),
      note: "If a shift would leave the grid, stop at the edge and continue the rest of the drift.",
    },
  ],
  verify: (vars, answer) => answer.coord === radarTarget(vars),
  status: () => "Tap the grid cell you were told, then confirm",
};
