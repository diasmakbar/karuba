import type { RoomHazard, Threat } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";

type SafeZoneVars = { threat: Threat; room: RoomHazard };

const CELLS_3 = ["A1", "B1", "C1", "A2", "B2", "C2", "A3", "B3", "C3"];

/** Info1_Baseline: the cells the weapon sweeps. */
export const THREAT_PATTERN: Record<Threat, string[]> = {
  Laser: ["A2", "B2", "C2"],
  Plasma: ["B1", "B2", "B3"],
  Kinetic: ["A1", "B2", "C3"],
};

/** Info2_Modifier: the cells already ruined by the room hazard. */
export const ROOM_HAZARD: Record<RoomHazard, string[]> = {
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

export function dangerousCells(vars: SafeZoneVars): string[] {
  return [...new Set([...THREAT_PATTERN[vars.threat], ...ROOM_HAZARD[vars.room]])];
}

/** Exactly one cell survives every combination defined above. */
export function safeCell(vars: SafeZoneVars): string {
  const dangerous = dangerousCells(vars);
  return CELLS_3.find((cell) => !dangerous.includes(cell)) ?? "B2";
}

export const mod12SafeZone: ModuleDefinition<"MOD_12_SAFE_ZONE"> = {
  id: "MOD_12_SAFE_ZONE",
  name: "Safe Zone",
  kind: "Elimination Component",
  generate: (rng) => ({
    threat: rng.pick(["Laser", "Plasma", "Kinetic"] as const),
    room: rng.pick(["Kitchen", "Armory", "Server"] as const),
  }),
  info1: (vars) => [
    {
      title: "Weapon coverage (Info 1)",
      columns: ["Threat", "Cells it hits"],
      rows: (["Laser", "Plasma", "Kinetic"] as const).map((threat) => ({
        cells: [threat, THREAT_LABEL[threat]],
        highlight: threat === vars.threat,
      })),
      note: "Columns A-C left to right, rows 1-3 top to bottom.",
    },
  ],
  info2: (vars) => [
    {
      title: "Room hazard (Info 2)",
      columns: ["Room", "Cells already destroyed"],
      rows: (["Kitchen", "Armory", "Server"] as const).map((room) => ({
        cells: [room, HAZARD_LABEL[room]],
        highlight: room === vars.room,
      })),
      note: "Cross out the weapon cells AND the hazard cells — one square is left.",
    },
  ],
  verify: (vars, answer) => answer.coord === safeCell(vars),
  status: () => "Tap the square you were told, then confirm",
};
