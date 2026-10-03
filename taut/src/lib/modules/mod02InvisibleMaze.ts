import type { Direction, MazeId } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";

const COLUMNS = ["A", "B", "C", "D"] as const;
const ROWS = [1, 2, 3, 4] as const;

/**
 * Walls are always on the EDGES between two cells — never "solid cells". A cell is only
 * impassable because every edge leading into it is walled, so the token can always find a way
 * around obstacles instead of being boxed in.
 *
 * Each entry `"<from>|<to>"` blocks movement between two orthogonally adjacent cells.
 */
const WALLED_EDGES: Record<MazeId, string[]> = {
  // Alpha: a vertical divider between B1/C1 and a horizontal divider between A2/A3.
  Alpha: ["B1|C1", "A2|A3"],
  // Beta: the center 2x2 is enclosed by walls on its whole perimeter — go around the block.
  Beta: [
    "A2|B2",
    "B2|C2",
    "C2|D2",
    "A3|B3",
    "B3|C3",
    "C3|D3",
    "B1|B2",
    "B3|B4",
    "C1|C2",
    "C3|C4",
  ],
  // Gamma: row 3 cannot be crossed horizontally (vertical moves through row 3 stay open).
  Gamma: ["A3|B3", "B3|C3", "C3|D3"],
};

export const MAZE_ARCHITECTURE: Record<MazeId, string[]> = {
  Alpha: [
    "A vertical wall sits between B1 and C1 — you cannot cross sideways there.",
    "A horizontal wall sits between A2 and A3 — you cannot cross there either.",
  ],
  Beta: [
    "The center 2x2 block (B2, B3, C2, C3) is sealed off — you must walk around it.",
    "HARDWARE FAULT IS ACTIVE on this maze (see Info 2).",
  ],
  Gamma: [
    "Row 3 cannot be crossed sideways: A3↔B3, B3↔C3 and C3↔D3 are all walled.",
    "Moving up/down through row 3 is fine.",
  ],
};

/** Info2_Modifier: the fault rotates every command one quarter turn clockwise. */
const FAULT_ROTATION: Record<Direction, Direction> = {
  UP: "RIGHT",
  RIGHT: "DOWN",
  DOWN: "LEFT",
  LEFT: "UP",
};

export function isMazeFaulted(mazeId: MazeId): boolean {
  return mazeId === "Beta";
}

export function commandFor(mazeId: MazeId, pressed: Direction): Direction {
  return isMazeFaulted(mazeId) ? FAULT_ROTATION[pressed] : pressed;
}

/** True when an edge between two cells is walled (order-independent). */
export function isEdgeWalled(mazeId: MazeId, a: string, b: string): boolean {
  const edges = WALLED_EDGES[mazeId];
  return edges.includes(`${a}|${b}`) || edges.includes(`${b}|${a}`);
}

/** The cell the token lands on, or null when the move hits a wall / the hull. */
export function nextCoord(mazeId: MazeId, from: string, pressed: Direction): string | null {
  const command = commandFor(mazeId, pressed);
  const col = COLUMNS.indexOf(from.charAt(0) as (typeof COLUMNS)[number]);
  const row = Number(from.slice(1));
  const delta: Record<Direction, [number, number]> = { UP: [0, -1], DOWN: [0, 1], LEFT: [-1, 0], RIGHT: [1, 0] };
  const nextCol = col + delta[command][0];
  const nextRow = row + delta[command][1];
  if (nextCol < 0 || nextCol >= COLUMNS.length || nextRow < 1 || nextRow > ROWS.length) return null;
  const target = `${COLUMNS[nextCol]}${nextRow}`;
  if (isEdgeWalled(mazeId, from, target)) return null;
  return target;
}

export const mod02InvisibleMaze: ModuleDefinition<"MOD_02_INVISIBLE_MAZE"> = {
  id: "MOD_02_INVISIBLE_MAZE",
  name: "Invisible Maze",
  kind: "Pathfinding Component",
  generate: (rng) => {
    const mazeId = rng.pick(["Alpha", "Beta", "Gamma"] as const);
    return { mazeId, startCoord: "A1", finishCoord: "D4", currentCoord: "A1" };
  },
  info1: (vars) => [
    {
      title: `Architecture map: ${vars.mazeId} (Info 1)`,
      columns: ["Hidden walls"],
      rows: MAZE_ARCHITECTURE[vars.mazeId].map((line) => ({ cells: [line], highlight: false })),
      note: `Token starts at ${vars.startCoord}, exit at ${vars.finishCoord}. All walls are BETWEEN cells. Read every line — the owner cannot see the walls.`,
    },
  ],
  info2: () => [
    {
      title: "Hardware fault status (Info 2)",
      columns: ["Status", "Effect on the D-pad"],
      rows: [
        { cells: ["FAULT ACTIVE", "UP outputs RIGHT · RIGHT outputs DOWN · DOWN outputs LEFT · LEFT outputs UP"], highlight: false },
        { cells: ["NO FAULT", "Each button outputs the direction printed on it"], highlight: false },
      ],
      note: "Announce the mapping before the owner presses anything — they cannot see this panel.",
    },
  ],
  verify: (vars, answer) => {
    const next = nextCoord(vars.mazeId, vars.currentCoord, answer.direction);
    return next !== null && next === vars.finishCoord;
  },
  advance: (vars, answer) => {
    const next = nextCoord(vars.mazeId, vars.currentCoord, answer.direction);
    if (next === null || next === vars.finishCoord) return null;
    return { ...vars, currentCoord: next };
  },
  status: (vars) => `Token at ${vars.currentCoord} · exit at ${vars.finishCoord}`,
};
