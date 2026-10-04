import type { Constellation, WindDirection } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
import { coordFrom, parseCoord } from "../rng";
import { vocabSize } from "../gameConfig";
import {
  CONSTELLATIONS,
  DRIFT_MAX,
  DRIFT_MIN,
  DRIFT_RULE,
  DRIFT_VECTOR,
  EPICENTER,
  GRID_SIZE,
  WIND_DIRECTIONS,
  mod08RadarConfig,
} from "./config/mod08Radar.config";

/** Info1_Baseline: the storm epicenter for each constellation. */
export { EPICENTER };
export { DRIFT_RULE };

/** Wrap an index around the grid edges (the radar "continues" past the edge to the other side). */
function wrapIndex(value: number, size: number): number {
  return ((value % size) + size) % size;
}

/**
 * The radar WRAPS at the edges: a drift that would leave the grid continues onto the opposite
 * side, so the target is always on screen and fully determined by epicenter + drift vector × steps.
 */
export function radarTarget(vars: {
  constellation: Constellation;
  windDirection: WindDirection;
  driftSteps: number;
}): string {
  const start = parseCoord(EPICENTER[vars.constellation]);
  const [ux, uy] = DRIFT_VECTOR[vars.windDirection];
  const steps = vars.driftSteps;
  return coordFrom(wrapIndex(start.col + ux * steps, GRID_SIZE), wrapIndex(start.row + uy * steps, GRID_SIZE));
}

/**
 * The drift description shown in Info 2. When `steps` is provided (the owner's own wind row),
 * the exact distance is appended; other rows show the direction only.
 */
export function driftRule(wind: WindDirection, steps?: number): string {
  return steps === undefined ? DRIFT_RULE[wind] : `${DRIFT_RULE[wind]} Distance: ${steps} cell${steps === 1 ? "" : "s"}.`;
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
    // Randomize the drift distance between DRIFT_MIN and DRIFT_MAX (inclusive).
    const driftSteps = DRIFT_MIN + rng.int(DRIFT_MAX - DRIFT_MIN + 1);
    return { constellation, windDirection, driftSteps, constellations, windDirections };
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
  info2: (vars) => {
    const activeWind = vars.windDirection;
    return [
      {
        title: "Drift pattern (Info 2)",
        columns: ["Wind arrow", "Drift from the epicenter"],
        rows: (Array.isArray(vars.windDirections) ? vars.windDirections : WIND_DIRECTIONS).map((wind) => ({
          cells: [wind, driftRule(wind, wind === activeWind ? vars.driftSteps : undefined)],
          highlight: wind === activeWind,
        })),
        note: "Only the owner's wind row gives the exact distance. If a drift would leave the grid, WRAP around: exiting one edge continues from the opposite edge.",
      },
    ];
  },
  verify: (vars, answer) => answer.coord === radarTarget(vars),
  status: () => "Tap the grid cell you were told, then confirm",
};
