import type { Constellation, WindDirection } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Storm Radar module (MOD_08).
 *
 * Constellation epicenters and wind drift vectors are data. Add a constellation or a wind
 * direction here and the implementation handles it, including the clamping at the grid edge.
 * The pool always holds at least 10 of each; `generate` picks a per-instance shortlist sized by
 * difficulty (5 for Beginner, 10 otherwise).
 */

/** Radar grid size (NxN), 0-based indexing. */
export const GRID_SIZE = 5;

/** Constellations the module can deal (>= 10 so a full Standard manual is possible). */
export const CONSTELLATIONS: readonly Constellation[] = [
  "Ursa",
  "Orion",
  "Draco",
  "Lyra",
  "Cassiopeia",
  "Cygnus",
  "Aquila",
  "Pegasus",
  "Corvus",
  "Vela",
];

/** The 8 real-world compass directions (max 8, capped to the compass rose). */
export const WIND_DIRECTIONS: readonly WindDirection[] = [
  "North",
  "NorthEast",
  "East",
  "SouthEast",
  "South",
  "SouthWest",
  "West",
  "NorthWest",
];

/** Info1_Baseline: the storm epicenter for each constellation. */
export const EPICENTER: Record<Constellation, string> = {
  Ursa: "C3",
  Orion: "A5",
  Draco: "E1",
  Lyra: "B2",
  Cassiopeia: "D4",
  Cygnus: "A1",
  Aquila: "E4",
  Pegasus: "C5",
  Corvus: "B4",
  Vela: "D2",
};

/**
 * Info2_Modifier: the drift DIRECTION per wind, as a UNIT vector (dx columns, dy rows). The
 * distance is rolled per instance between `DRIFT_MIN` and `DRIFT_MAX`, so the informant must ask
 * the owner how far the reading drifted; only the direction is fixed by the wind arrow.
 */
export const DRIFT_VECTOR: Record<WindDirection, readonly [number, number]> = {
  North: [0, -1],
  NorthEast: [1, -1],
  East: [1, 0],
  SouthEast: [1, 1],
  South: [0, 1],
  SouthWest: [-1, 1],
  West: [-1, 0],
  NorthWest: [-1, -1],
};

/** Inclusive range for the randomized drift distance (in cells). */
export const DRIFT_MIN = 1;
export const DRIFT_MAX = 2;

/** Human-readable drift direction (Info 2); the exact distance is read from the owner. */
export const DRIFT_RULE: Record<WindDirection, string> = {
  North: "Drift UP (toward row 1).",
  NorthEast: "Drift toward the top-right corner.",
  East: "Drift RIGHT (toward column E).",
  SouthEast: "Drift toward the bottom-right corner.",
  South: "Drift DOWN (toward row 5).",
  SouthWest: "Drift toward the bottom-left corner.",
  West: "Drift LEFT (toward column A).",
  NorthWest: "Drift toward the top-left corner.",
};

export const mod08RadarConfig: ModuleConfig<"MOD_08_RADAR"> = {
  id: "MOD_08_RADAR",
  name: "Storm Radar",
  kind: "Spatial Component",
  rules: {
    gridSize: GRID_SIZE,
    constellations: CONSTELLATIONS,
    windDirections: WIND_DIRECTIONS,
    epicenter: EPICENTER,
    driftVector: DRIFT_VECTOR,
    driftMin: DRIFT_MIN,
    driftMax: DRIFT_MAX,
    driftRule: DRIFT_RULE,
    infoNotes: {
      info1: "Columns are A-E left to right, rows are 1-5 top to bottom.",
      info2:
        "The wind arrow sets the DIRECTION only; ask the owner how many cells it drifted (1 or 2). If a drift would leave the grid, WRAP around: exiting one edge continues from the opposite edge on that axis.",
    },
  },
};
