import type { Constellation, WindDirection } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
import { clampIndex, coordFrom, parseCoord } from "../rng";
import { vocabSize } from "../gameConfig";
import {
  CONSTELLATIONS,
  DRIFT_DELTA,
  DRIFT_RULE,
  EPICENTER,
  GRID_SIZE,
  WIND_DIRECTIONS,
  mod08RadarConfig,
} from "./config/mod08Radar.config";

/** Info1_Baseline: the storm epicenter for each constellation. */
export { EPICENTER };
export { DRIFT_RULE };

/**
 * Clamping models the radar edge: a shift that would leave the grid simply stops
 * on that axis, so the target always stays on screen.
 */
export function radarTarget(vars: { constellation: Constellation; windDirection: WindDirection }): string {
  const start = parseCoord(EPICENTER[vars.constellation]);
  const [dx, dy] = DRIFT_DELTA[vars.windDirection];
  return coordFrom(clampIndex(start.col + dx, GRID_SIZE), clampIndex(start.row + dy, GRID_SIZE));
}

export const mod08Radar: ModuleDefinition<"MOD_08_RADAR"> = {
  config: mod08RadarConfig,
  id: mod08RadarConfig.id,
  name: mod08RadarConfig.name,
  kind: mod08RadarConfig.kind,
  generate: (rng, difficulty) => {
    const n = vocabSize(difficulty);
    // Pick a per-instance shortlist that always contains the correct item plus decoys.
    const constellation = rng.pick(CONSTELLATIONS);
    const windDirection = rng.pick(WIND_DIRECTIONS);
    const constellationPool = rng.shuffle(
      CONSTELLATIONS.filter((item) => item !== constellation) as Constellation[],
    );
    const windPool = rng.shuffle(WIND_DIRECTIONS.filter((wind) => wind !== windDirection) as WindDirection[]);
    const constellations = rng.shuffle<Constellation>([constellation, ...constellationPool.slice(0, n - 1)]);
    const windDirections = rng.shuffle<WindDirection>([windDirection, ...windPool.slice(0, n - 1)]);
    return { constellation, windDirection, constellations, windDirections };
  },
  info1: (vars) => [
    {
      title: "Epicenter chart (Info 1)",
      columns: ["Constellation on screen", "Epicenter"],
      rows: (Array.isArray(vars.constellations) ? vars.constellations : CONSTELLATIONS).map((item) => ({
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
      rows: (Array.isArray(vars.windDirections) ? vars.windDirections : WIND_DIRECTIONS).map((wind) => ({
        cells: [wind, DRIFT_RULE[wind]],
        highlight: wind === vars.windDirection,
      })),
      note: "If a shift would leave the grid, stop at the edge and continue the rest of the drift.",
    },
  ],
  verify: (vars, answer) => answer.coord === radarTarget(vars),
  status: () => "Tap the grid cell you were told, then confirm",
};
