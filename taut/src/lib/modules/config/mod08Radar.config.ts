import type { Constellation, WindDirection } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Storm Radar module (MOD_08).
 *
 * Constellation epicenters and wind drift vectors are data. Add a constellation or a wind
 * direction here and the implementation handles it, including the clamping at the grid edge.
 */

/** Radar grid size (NxN), 0-based indexing. */
export const GRID_SIZE = 5;

/** Constellations the module can deal. */
export const CONSTELLATIONS: readonly Constellation[] = ["Ursa", "Orion", "Draco"];

/** Wind directions the module can deal. */
export const WIND_DIRECTIONS: readonly WindDirection[] = ["North", "East", "South"];

/** Info1_Baseline: the storm epicenter for each constellation. */
export const EPICENTER: Record<Constellation, string> = {
  Ursa: "C3",
  Orion: "A5",
  Draco: "E1",
};

/** Info2_Modifier: how the reading drifts off the epicenter (dx columns, dy rows). */
export const DRIFT_DELTA: Record<WindDirection, readonly [number, number]> = {
  North: [-1, -1],
  East: [2, -1],
  South: [0, 2],
};

/** Human-readable drift description (Info 2). */
export const DRIFT_RULE: Record<WindDirection, string> = {
  North: "Drift 1 column left and 1 row up.",
  East: "Drift 2 columns right and 1 row up.",
  South: "Drift 2 rows down.",
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
