import type { RoomHazard, Threat } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Safe Zone module (MOD_12).
 *
 * The 3x3 grid, weapon coverage and room hazards are data.
 *
 * INVARIANT: `threat ∪ room` must cover exactly 8 of the 9 cells for EVERY threat/room pair, so
 * exactly one safe cell always survives. The patterns below are constructed so each threat covers
 * exactly TWO cells in each row and each room is "two whole rows" (a 6-cell band); their union
 * always leaves one cell. If you edit these, re-verify all 9 combinations.
 *
 * Grid (columns A-C, rows 1-3):
 *   A1 B1 C1
 *   A2 B2 C2
 *   A3 B3 C3
 */

/** The 3x3 grid cells. */
export const CELLS_3 = ["A1", "B1", "C1", "A2", "B2", "C2", "A3", "B3", "C3"] as const;

/** Threats the module can deal. */
export const THREATS: readonly Threat[] = ["Laser", "Plasma", "Kinetic"];

/** Room hazards the module can deal. */
export const ROOMS: readonly RoomHazard[] = ["Kitchen", "Armory", "Server"];

/**
 * Info1_Baseline: the cells the weapon sweeps. Each threat covers two cells in each row, which
 * guarantees a single survivor against any room band below.
 */
export const THREAT_PATTERN: Record<Threat, readonly string[]> = {
  Laser: ["A1", "B1", "A2", "B2", "A3", "B3"],
  Plasma: ["B1", "C1", "B2", "C2", "B3", "C3"],
  Kinetic: ["A1", "C1", "A2", "C2", "A3", "C3"],
};

/** Info2_Modifier: the cells already ruined by the room hazard (two whole rows each). */
export const ROOM_HAZARD: Record<RoomHazard, readonly string[]> = {
  Kitchen: ["A1", "B1", "C1", "A2", "B2", "C2"],
  Armory: ["A2", "B2", "C2", "A3", "B3", "C3"],
  Server: ["A1", "B1", "C1", "A3", "B3", "C3"],
};

export const THREAT_LABEL: Record<Threat, string> = {
  Laser: "Covers columns A and B in every row (A1,B1, A2,B2, A3,B3).",
  Plasma: "Covers columns B and C in every row (B1,C1, B2,C2, B3,C3).",
  Kinetic: "Covers columns A and C in every row (A1,C1, A2,C2, A3,C3).",
};

export const HAZARD_LABEL: Record<RoomHazard, string> = {
  Kitchen: "Rows 1 and 2 are gone (A1-C1, A2-C2).",
  Armory: "Rows 2 and 3 are gone (A2-C2, A3-C3).",
  Server: "Rows 1 and 3 are gone (A1-C1, A3-C3).",
};

export const mod12SafeZoneConfig: ModuleConfig<"MOD_12_SAFE_ZONE"> = {
  id: "MOD_12_SAFE_ZONE",
  name: "Safe Zone",
  kind: "Elimination Component",
  rules: {
    cells: CELLS_3,
    threats: THREATS,
    rooms: ROOMS,
    threatPattern: THREAT_PATTERN,
    roomHazard: ROOM_HAZARD,
    threatLabel: THREAT_LABEL,
    hazardLabel: HAZARD_LABEL,
    infoNotes: {
      info1: "Columns A-C left to right, rows 1-3 top to bottom.",
      info2: "Cross out the weapon cells AND the hazard cells — one square is left.",
    },
  },
};
