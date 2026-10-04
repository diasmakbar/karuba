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

/** Wind directions the module can deal (>= 10 so a full Standard manual is possible). */
export const WIND_DIRECTIONS: readonly WindDirection[] = [
  "North",
  "East",
  "South",
  "West",
  "NorthEast",
  "SouthEast",
  "SouthWest",
  "NorthWest",
  "NorthNorthWest",
  "SouthSouthEast",
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

/** Info2_Modifier: how the reading drifts off the epicenter (dx columns, dy rows). */
export const DRIFT_DELTA: Record<WindDirection, readonly [number, number]> = {
  North: [-1, -1],
  East: [2, -1],
  South: [0, 2],
  West: [-2, 1],
  NorthEast: [1, -2],
  SouthEast: [1, 2],
  SouthWest: [-1, 2],
  NorthWest: [-1, -1],
  NorthNorthWest: [0, -2],
  SouthSouthEast: [0, 3],
};

/** Human-readable drift description (Info 2). */
export const DRIFT_RULE: Record<WindDirection, string> = {
  North: "Drift 1 column left and 1 row up.",
  East: "Drift 2 columns right and 1 row up.",
  South: "Drift 2 rows down.",
  West: "Drift 2 columns left and 1 row down.",
  NorthEast: "Drift 1 column right and 2 rows up.",
  SouthEast: "Drift 1 column right and 2 rows down.",
  SouthWest: "Drift 1 column left and 2 rows down.",
  NorthWest: "Drift 1 column left and 1 row up.",
  NorthNorthWest: "Drift 2 rows up.",
  SouthSouthEast: "Drift 3 rows down.",
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
    driftDelta: DRIFT_DELTA,
    driftRule: DRIFT_RULE,
    infoNotes: {
      info1: "Columns are A-E left to right, rows are 1-5 top to bottom.",
      info2: "If a shift would leave the grid, stop at the edge and continue the rest of the drift.",
    },
  },
};
