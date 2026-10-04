import type { RoomHazard, Threat } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
import {
  CELLS_3,
  HAZARD_LABEL,
  ROOMS,
  ROOM_HAZARD,
  THREATS,
  THREAT_LABEL,
  THREAT_PATTERN,
  mod12SafeZoneConfig,
} from "./config/mod12SafeZone.config";

type SafeZoneVars = { threat: Threat; room: RoomHazard };

/** Info1_Baseline: the cells the weapon sweeps. */
export { THREAT_PATTERN };
/** Info2_Modifier: the cells already ruined by the room hazard. */
export { ROOM_HAZARD };
export { THREAT_LABEL };
export { HAZARD_LABEL };

export function dangerousCells(vars: SafeZoneVars): string[] {
  return [...new Set([...THREAT_PATTERN[vars.threat], ...ROOM_HAZARD[vars.room]])];
}

/** Exactly one cell survives every configured combination. */
export function safeCell(vars: SafeZoneVars): string {
  const dangerous = dangerousCells(vars);
  return CELLS_3.find((cell) => !dangerous.includes(cell)) ?? "B2";
}

export const mod12SafeZone: ModuleDefinition<"MOD_12_SAFE_ZONE"> = {
  config: mod12SafeZoneConfig,
  id: mod12SafeZoneConfig.id,
  name: mod12SafeZoneConfig.name,
  kind: mod12SafeZoneConfig.kind,
  generate: (rng, _difficulty) => ({
    threat: rng.pick(THREATS),
    room: rng.pick(ROOMS),
  }),
  info1: (vars) => [
    {
      title: "Weapon coverage (Info 1)",
      columns: ["Threat", "Cells it hits"],
      rows: THREATS.map((threat) => ({
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
      rows: ROOMS.map((room) => ({
        cells: [room, HAZARD_LABEL[room]],
        highlight: room === vars.room,
      })),
      note: "Cross out the weapon cells AND the hazard cells — one square is left.",
    },
  ],
  verify: (vars, answer) => answer.coord === safeCell(vars),
  status: () => "Tap the square you were told, then confirm",
};
