import type { Direction, MazeId } from "../../types/db-schema";
import type { MazeGrid, ModuleDefinition } from "./contract";
import { randomSerialNumber } from "../rng";
import {
  MAZE_COLUMNS,
  MAZE_ROWS,
  ROTATION_MAP,
  WALLED_EDGES,
  mod02InvisibleMazeConfig,
} from "./config/mod02InvisibleMaze.config";

const COLUMNS = MAZE_COLUMNS;
const ROWS = MAZE_ROWS;

/**
 * A wall-barrier map for the manual, derived straight from the config's `WALLED_EDGES` so the
 * grid shown in Info 1 can never drift from the walls used by [`nextCoord()`].
 */
export const MAZE_ARCHITECTURE: Record<MazeId, MazeGrid> = {
  Alpha: { columns: COLUMNS, rows: ROWS, walls: WALLED_EDGES.Alpha },
  Beta: { columns: COLUMNS, rows: ROWS, walls: WALLED_EDGES.Beta },
  Gamma: { columns: COLUMNS, rows: ROWS, walls: WALLED_EDGES.Gamma },
};

export function commandFor(serialNumber: string, pressed: Direction): Direction {
  const isEven = Number(serialNumber.slice(-1)) % 2 === 0;
  return ROTATION_MAP[pressed][isEven ? "even" : "odd"];
}

/** Check if there's a valid path from start to finish using BFS */
function hasValidPath(mazeId: MazeId, start: string, finish: string): boolean {
  const visited = new Set<string>();
  const queue: string[] = [start];
  visited.add(start);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === finish) return true;

    const col = COLUMNS.indexOf(current.charAt(0) as (typeof COLUMNS)[number]);
    const row = Number(current.slice(1));
    const deltas: Record<Direction, [number, number]> = { UP: [0, -1], DOWN: [0, 1], LEFT: [-1, 0], RIGHT: [1, 0] };

    for (const dir of Object.keys(deltas) as Direction[]) {
      const nextCol = col + deltas[dir][0];
      const nextRow = row + deltas[dir][1];
      if (nextCol < 0 || nextCol >= COLUMNS.length || nextRow < 1 || nextRow > ROWS.length) continue;
      const target = `${COLUMNS[nextCol]}${nextRow}`;
      if (visited.has(target) || isEdgeWalled(mazeId, current, target)) continue;
      visited.add(target);
      queue.push(target);
    }
  }
  return false;
}

/** True when an edge between two cells is walled (order-independent). */
export function isEdgeWalled(mazeId: MazeId, a: string, b: string): boolean {
  const edges = WALLED_EDGES[mazeId];
  return edges.includes(`${a}|${b}`) || edges.includes(`${b}|${a}`);
}

/** The cell the token lands on, or null when the move hits a wall / the hull. */
export function nextCoord(mazeId: MazeId, from: string, pressed: Direction): string | null {
  const col = COLUMNS.indexOf(from.charAt(0) as (typeof COLUMNS)[number]);
  const row = Number(from.slice(1));
  const delta: Record<Direction, [number, number]> = { UP: [0, -1], DOWN: [0, 1], LEFT: [-1, 0], RIGHT: [1, 0] };
  const nextCol = col + delta[pressed][0];
  const nextRow = row + delta[pressed][1];
  if (nextCol < 0 || nextCol >= COLUMNS.length || nextRow < 1 || nextRow > ROWS.length) return null;
  const target = `${COLUMNS[nextCol]}${nextRow}`;
  if (isEdgeWalled(mazeId, from, target)) return null;
  return target;
}

export const mod02InvisibleMaze: ModuleDefinition<"MOD_02_INVISIBLE_MAZE"> = {
  config: mod02InvisibleMazeConfig,
  id: mod02InvisibleMazeConfig.id,
  name: mod02InvisibleMazeConfig.name,
  kind: mod02InvisibleMazeConfig.kind,
  generate: (rng, _difficulty) => {
    const mazeId = rng.pick(["Alpha", "Beta", "Gamma"] as const);
    const serialNumber = randomSerialNumber(rng);

    let startCoord, finishCoord;
    let valid = false;
    let attempts = 0;

    while (!valid && attempts < 1000) {
      startCoord = `${COLUMNS[rng.int(COLUMNS.length)]}${ROWS[rng.int(ROWS.length)]}`;
      finishCoord = `${COLUMNS[rng.int(COLUMNS.length)]}${ROWS[rng.int(ROWS.length)]}`;

      // Pastikan titik tidak sama, lalu pastikan jalurnya bisa diselesaikan
      if (startCoord !== finishCoord && hasValidPath(mazeId, startCoord, finishCoord)) {
        valid = true;
      }
      attempts++;
    }

    return { mazeId, startCoord: startCoord!, finishCoord: finishCoord!, currentCoord: startCoord!, serialNumber };
  },
  info1: (vars) => [
    {
      title: `Architecture map: ${vars.mazeId} (Info 1)`,
      columns: ["Hidden walls"],
      rows: [],
      grid: MAZE_ARCHITECTURE[vars.mazeId],
      note: `Thick lines are walls between cells. Token starts at ${vars.startCoord}, exit at ${vars.finishCoord} — guide the owner step by step.`,
    },
  ],
  info2: () => [
    {
      title: "D-pad rotation (Info 2)",
      columns: ["Serial number ends in", "Effect on the D-pad"],
      rows: [
        {
          cells: [
            "EVEN digit",
            "Rotated CCW 90° (UP=LEFT, RIGHT=UP, DOWN=RIGHT, LEFT=DOWN)",
          ],
          highlight: false,
        },
        {
          cells: [
            "ODD digit",
            "Rotated CW 90° (UP=RIGHT, RIGHT=DOWN, DOWN=LEFT, LEFT=UP)",
          ],
          highlight: false,
        },
      ],
      note: "Ask the owner for the last digit of their serial number, then read them the matching row.",
    },
  ],
  // A step is "correct" when the mapped move is legal (not a wall, not out of bounds).
  // Reaching the exit is decided by `advance` (returning null = module finished).
  verify: (vars, answer) => {
    const command = commandFor(vars.serialNumber, answer.direction);
    return nextCoord(vars.mazeId, vars.currentCoord, command) !== null;
  },
  advance: (vars, answer) => {
    const command = commandFor(vars.serialNumber, answer.direction);
    const next = nextCoord(vars.mazeId, vars.currentCoord, command);
    if (next === null) return { ...vars }; // illegal move is already a strike in verify
    if (next === vars.finishCoord) return null; // reached the exit -> solved
    return { ...vars, currentCoord: next };
  },
  status: (vars) => `Token at ${vars.currentCoord} · exit at ${vars.finishCoord}`,
};
