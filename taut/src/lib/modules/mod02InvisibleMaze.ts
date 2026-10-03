import type { Direction, MazeId } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";

const COLUMNS = ["A", "B", "C", "D"] as const;
const ROWS = [1, 2, 3, 4] as const;

export const MAZE_ARCHITECTURE: Record<MazeId, string[]> = {
  Alpha: [
    "A solid wall between B1 and C1 — you cannot cross sideways there.",
    "A solid wall between A2 and A3 — you cannot cross there either.",
  ],
  Beta: [
    "The center 2x2 (B2, B3, C2, C3) is solid — those cells cannot be entered.",
    "HARDWARE FAULT IS ACTIVE on this maze (see Info 2).",
  ],
  Gamma: [
    "Row 3 is blocked for horizontal movement: A3↔B3, B3↔C3 and C3↔D3 are all walled.",
    "Vertical moves through row 3 are fine.",
  ],
};

const SOLID_CELLS: Record<MazeId, string[]> = {
  Alpha: [],
  Beta: ["B2", "B3", "C2", "C3"],
  Gamma: [],
};

const WALLED_PAIRS: Record<MazeId, string[]> = {
  Alpha: ["B1|C1", "A2|A3"],
  Beta: [],
  Gamma: ["A3|B3", "B3|C3", "C3|D3"],
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

export function isSolid(mazeId: MazeId, coord: string): boolean {
  return SOLID_CELLS[mazeId].includes(coord);
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
  if (isSolid(mazeId, target)) return null;
  if (WALLED_PAIRS[mazeId].includes(`${from}|${target}`) || WALLED_PAIRS[mazeId].includes(`${target}|${from}`)) return null;
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
      rows: MAZE_ARCHITECTURE[vars.mazeId].map((line) => ({ cells: [line], highlight: true })),
      note: `Token starts at ${vars.startCoord}, exit at ${vars.finishCoord}. Read every line — the owner cannot see the walls.`,
    },
  ],
  info2: (vars) => [
    {
      title: "Hardware fault status (Info 2)",
      columns: ["Status", "Effect on the D-pad"],
      rows: [
        { cells: ["FAULT ACTIVE", "UP outputs RIGHT · RIGHT outputs DOWN · DOWN outputs LEFT · LEFT outputs UP"], highlight: isMazeFaulted(vars.mazeId) },
        { cells: ["NO FAULT", "Each button outputs the direction printed on it"], highlight: !isMazeFaulted(vars.mazeId) },
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
