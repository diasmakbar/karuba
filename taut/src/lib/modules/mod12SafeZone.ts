import type { ModuleDefinition } from "./contract";
import { GRID_COLUMNS } from "../rng";
import type { Rng } from "../rng";
import { safeZoneGridSize, safeZoneVocabSize } from "../gameConfig";
import { HAZARD_LABEL, ROOMS, THREATS, THREAT_LABEL, mod12SafeZoneConfig } from "./config/mod12SafeZone.config";

/** Cell `k` of an `NxN` grid, laid out column-by-column (A1..AN, B1..BN, ...). */
function cellAt(k: number, n: number): string {
  return `${GRID_COLUMNS[Math.floor(k / n)]}${(k % n) + 1}`;
}

/**
 * The single cell shared by a threat's covered set and a room's covered set — the intersection.
 * Returns null unless the intersection is exactly one cell.
 */
export function safeCellFor(
  threat: string,
  room: string,
  threatCells: Record<string, string[]>,
  roomCells: Record<string, string[]>,
): string | null {
  const t = threatCells[threat] ?? [];
  const r = roomCells[room] ?? [];
  const overlap = t.filter((cell) => r.includes(cell));
  return overlap.length === 1 ? overlap[0] : null;
}

/**
 * Distinct, pairwise-single intersections over the whole grid, assembled from disjoint columns.
 *
 * With vocabulary size `V` and grid `N`, assign each threat i a distinct column `i` and each room
 * j a distinct column `V + j` (both < N, so every set stays single-column and stops a pair from
 * meeting in two cells). Then threat i covers row `j` of its column for every room j, room j covers
 * row `i` of its column for every threat i: pair (i,j) meets at exactly (`column i`, `row j`). As
 * (i,j) ranges over all V^2 pairs those cells are all distinct, one per cell of the VxV block.
 */
function buildCells(v: number): { threatCells: Record<string, string[]>; roomCells: Record<string, string[]> } {
  const threatCells: Record<string, string[]> = {};
  const roomCells: Record<string, string[]> = {};
  const activeThreats = THREATS.slice(0, v);
  const activeRooms = ROOMS.slice(0, v);

  activeThreats.forEach((threat, i) => {
    threatCells[threat] = activeRooms.map((_room, j) => `${GRID_COLUMNS[i]}${j + 1}`);
  });
  activeRooms.forEach((room, j) => {
    roomCells[room] = activeThreats.map((_threat, i) => `${GRID_COLUMNS[v + j]}${i + 1}`);
  });

  return { threatCells, roomCells };
}

/**
 * Validate the full decoy invariant: every (threat, room) pair over the active vocabulary
 * intersects in exactly one cell, and all of those answer cells are distinct.
 */
function invariantHolds(n: number, v: number, threatCells: Record<string, string[]>, roomCells: Record<string, string[]>): boolean {
  const seen = new Set<string>();
  const activeThreats = THREATS.slice(0, v);
  const activeRooms = ROOMS.slice(0, v);
  for (const threat of activeThreats) {
    for (const room of activeRooms) {
      const cell = safeCellFor(threat, room, threatCells, roomCells);
      if (cell === null) return false;
      if (seen.has(cell)) return false;
      seen.add(cell);
    }
  }
  // Exactly V^2 distinct pair answers, all inside the NxN grid.
  if (seen.size !== v * v) return false;
  const valid = new Set<string>();
  for (let k = 0; k < n * n; k += 1) valid.add(cellAt(k, n));
  return [...seen].every((cell) => valid.has(cell));
}

export const mod12SafeZone: ModuleDefinition<"MOD_12_SAFE_ZONE"> = {
  config: mod12SafeZoneConfig,
  id: mod12SafeZoneConfig.id,
  name: mod12SafeZoneConfig.name,
  kind: mod12SafeZoneConfig.kind,
  generate: (rng: Rng, difficulty) => {
    const n = safeZoneGridSize(difficulty);
    const v = safeZoneVocabSize(difficulty);
    const activeThreats = THREATS.slice(0, v);
    const activeRooms = ROOMS.slice(0, v);

    // Safety net: the constructive layout always holds, but re-roll if a future tweak breaks it.
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const { threatCells, roomCells } = buildCells(v);
      const threat = rng.pick(activeThreats);
      const room = rng.pick(activeRooms);
      if (invariantHolds(n, v, threatCells, roomCells)) {
        return { threat, room, gridSize: n, threatCells, roomCells };
      }
    }
    // Config invariant should make this unreachable; fall back to a deterministic known-good pair.
    const { threatCells, roomCells } = buildCells(v);
    return { threat: activeThreats[0], room: activeRooms[0], gridSize: n, threatCells, roomCells };
  },
  info1: (vars) => [
    {
      title: "Threat coverage (Info 1)",
      columns: ["Threat", "Cells it covers"],
      rows: THREATS.slice(0, Object.keys(vars.threatCells).length).map((threat) => ({
        cells: [threat, (vars.threatCells[threat] ?? []).join(", ") || "—"],
        highlight: threat === vars.threat,
      })),
      note: "Columns run left to right, rows run top to bottom.",
    },
  ],
  info2: (vars) => [
    {
      title: "Room coverage (Info 2)",
      columns: ["Room", "Cells it covers"],
      rows: ROOMS.slice(0, Object.keys(vars.roomCells).length).map((room) => ({
        cells: [room, (vars.roomCells[room] ?? []).join(", ") || "—"],
        highlight: room === vars.room,
      })),
      note: "The safe cell is the ONE cell that appears in BOTH the owner's threat row (Info 1) and the owner's room row (Info 2).",
    },
  ],
  verify: (vars, answer) => answer.coord === safeCellFor(vars.threat, vars.room, vars.threatCells, vars.roomCells),
  status: () => "Tap the overlapping square you were told, then confirm",
};

// Keep the flavour labels reachable for callers that re-export the module's manual text.
export { THREAT_LABEL, HAZARD_LABEL };
