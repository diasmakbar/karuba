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
 * Info2_Modifier: the drift DIRECTION per wind as a UNIT vector (dx columns, dy rows). The actual
 * magnitude `x` is rolled independently PER DIRECTION (between DRIFT_MIN and DRIFT_MAX), so the
 * delta is `unit × x`. Meaning = "2 steps in the unit direction, or 1 step if x rolled 1".
 */
export const DRIFT_UNIT: Record<WindDirection, readonly [number, number]> = {
  North: [0, -1],
  NorthEast: [1, -1],
  East: [1, 0],
  SouthEast: [1, 1],
  South: [0, 1],
  SouthWest: [-1, 1],
  West: [-1, 0],
  NorthWest: [-1, -1],
};

/** Inclusive range for each direction's independent magnitude. */
export const DRIFT_MIN = 1;
export const DRIFT_MAX = 2;

/**
 * Build the delta for a direction at a given magnitude: `unit × x`.
 * North x=1 -> [0,-1]; SouthEast x=2 -> [2,2].
 */
export function driftDelta(wind: WindDirection, x: number): readonly [number, number] {
  const [ux, uy] = DRIFT_UNIT[wind];
  return [ux * x, uy * x];
}

/**
 * Build the human-readable drift rule for a direction at a given magnitude, matching `driftDelta`
 * exactly. North x=1 -> "Drift 1 row up."; SouthEast x=2 -> "Drift 2 columns right and 2 rows down."
 */
export function driftRule(wind: WindDirection, x: number): string {
  const [dx, dy] = driftDelta(wind, x);
  const parts: string[] = [];
  if (dx !== 0) parts.push(`Drift ${Math.abs(dx)} column${Math.abs(dx) === 1 ? "" : "s"} ${dx > 0 ? "right" : "left"}`);
  if (dy !== 0) parts.push(`${parts.length > 0 ? "and " : "Drift "}${Math.abs(dy)} row${Math.abs(dy) === 1 ? "" : "s"} ${dy > 0 ? "down" : "up"}`);
  return `${parts.join(" ")}.`;
}

export const mod08RadarConfig: ModuleConfig<"MOD_08_RADAR"> = {
  id: "MOD_08_RADAR",
  name: "Storm Radar",
  kind: "Spatial Component",
  rules: {
    gridSize: GRID_SIZE,
    constellations: CONSTELLATIONS,
    windDirections: WIND_DIRECTIONS,
    epicenter: EPICENTER,
    driftUnit: DRIFT_UNIT,
    driftMin: DRIFT_MIN,
    driftMax: DRIFT_MAX,
    infoNotes: {
      info1: "Columns are A-E left to right, rows are 1-5 top to bottom.",
      info2: "If a drift would leave the grid, WRAP around: exiting one edge continues from the opposite edge on that axis.",
    },
  },
};
