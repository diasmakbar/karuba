import type { RoomHazard, Threat } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Safe Zone module (MOD_12).
 *
 * The 3x3 grid, weapon coverage and room hazards are data. Every threat/hazard combination must
 * leave exactly one safe cell — keep that invariant in mind when editing this file.
 */

/** The 3x3 grid cells. */
export const CELLS_3 = ["A1", "B1", "C1", "A2", "B2", "C2", "A3", "B3", "C3"] as const;

/** Threats the module can deal. */
export const THREATS: readonly Threat[] = ["Laser", "Plasma", "Kinetic"];

/** Room hazards the module can deal. */
export const ROOMS: readonly RoomHazard[] = ["Kitchen", "Armory", "Server"];

/** Info1_Baseline: the cells the weapon sweeps. */
export const THREAT_PATTERN: Record<Threat, readonly string[]> = {
  Laser: ["A2", "B2", "C2"],
  Plasma: ["B1", "B2", "B3"],
  Kinetic: ["A1", "B2", "C3"],
};

/** Info2_Modifier: the cells already ruined by the room hazard. */
export const ROOM_HAZARD: Record<RoomHazard, readonly string[]> = {
  Kitchen: ["A1", "A2", "A3", "C1", "C2", "C3"],
  Armory: ["A1", "B1", "C1", "A3", "B3", "C3"],
  Server: ["B2", "A1", "A3", "C1", "C3"],
};

export const THREAT_LABEL: Record<Threat, string> = {
  Laser: "Sweeps row 2 (A2, B2, C2)",
  Plasma: "Sweeps column B (B1, B2, B3)",
  Kinetic: "Hits the diagonal (A1, B2, C3)",
};

export const HAZARD_LABEL: Record<RoomHazard, string> = {
  Kitchen: "Columns A and C are gone (A1-A3, C1-C3)",
  Armory: "Rows 1 and 3 are gone (A1-C1, A3-C3)",
  Server: "B2 plus all four corners are gone (A1, A3, C1, C3)",
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
