import type { Direction, MazeId } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
import { randomSerialNumber } from "../rng";

const COLUMNS = ["A", "B", "C", "D", "E", "F"] as const;
const ROWS = [1, 2, 3, 4, 5, 6] as const;

/**
 * Walls are always on the EDGES between two cells — never "solid cells". A cell is only
 * impassable because every edge leading into it is walled, so the token can always find a way
 * around obstacles instead of being boxed in.
 *
 * Each entry `"<from>|<to>"` blocks movement between two orthogonally adjacent cells.
 */
const WALLED_EDGES: Record<MazeId, string[]> = {
  Alpha: [
    "A1|A2", "B1|C1", "C1|C2", "D2|E2", "E1|F1", "F2|F3", 
    "A3|B3", "B3|B4", "C3|D3", "D3|D4", "E4|F4", "A5|A6", "C5|C6", "D5|E5"
  ],
  Beta: [
    "A2|B2", "B2|B3", "C1|D1", "E2|E3", "D3|D4", "E3|F3", 
    "B4|C4", "A5|B5", "C5|D5", "E4|F4", "E5|E6", "F5|F6"
  ],
  Gamma: [
    "A1|B1", "A2|A3", "C2|D2", "B3|C3", "D3|E3", "E2|E3", 
    "F1|F2", "A4|B4", "B4|B5", "B5|C5", "D5|D6", "E5|F5"
  ],
};

/** True when `a` and `b` share a walled edge (order-independent). */
function hasWall(edges: Set<string>, a: string, b: string): boolean {
  return edges.has(`${a}|${b}`) || edges.has(`${b}|${a}`);
}

/**
 * Render a 6x6 map straight from `WALLED_EDGES` so the manual shown in Info 1 can never drift
 * from the walls used by [`nextCoord()`]. Verticals live between columns, horizontals between rows.
 */
export function renderMaze(mazeId: MazeId): string[] {
  const edges = new Set(WALLED_EDGES[mazeId]);
  const lines: string[] = ["  A   B   C   D   E   F", "+---+---+---+---+---+---+"];
  for (let r = 0; r < ROWS.length; r += 1) {
    let cells = "|";
    for (let c = 0; c < COLUMNS.length; c += 1) {
      const here = `${COLUMNS[c]}${ROWS[r]}`;
      const right = COLUMNS[c + 1] ? `${COLUMNS[c + 1]}${ROWS[r]}` : null;
      cells += "   "; // 3-wide cell interior
      cells += right && hasWall(edges, here, right) ? "|" : " ";
    }
    lines.push(`${cells} ${ROWS[r]}`); // trailing row label so players can name cells
    if (r < ROWS.length - 1) {
      let sep = "+";
      for (let c = 0; c < COLUMNS.length; c += 1) {
        const here = `${COLUMNS[c]}${ROWS[r]}`;
        const below = `${COLUMNS[c]}${ROWS[r + 1]}`;
        sep += (hasWall(edges, here, below) ? "---" : "   ") + "+";
      }
      lines.push(sep);
    }
  }
  lines.push("+---+---+---+---+---+---+");
  return lines;
}

export const MAZE_ARCHITECTURE: Record<MazeId, string[]> = {
  Alpha: renderMaze("Alpha"),
  Beta: renderMaze("Beta"),
  Gamma: renderMaze("Gamma"),
};

/** Info2_Modifier: serialNumber-based control rotation */
const ROTATION_MAP: Record<Direction, Record<"even" | "odd", Direction>> = {
  UP: { even: "LEFT", odd: "RIGHT" },
  RIGHT: { even: "UP", odd: "DOWN" },
  DOWN: { even: "RIGHT", odd: "LEFT" },
  LEFT: { even: "DOWN", odd: "UP" },
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
  id: "MOD_02_INVISIBLE_MAZE",
  name: "Invisible Maze",
  kind: "Pathfinding Component",
  generate: (rng) => {
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
      rows: MAZE_ARCHITECTURE[vars.mazeId].map((line) => ({ cells: [line], highlight: false })),
      note: `Token starts at ${vars.startCoord}, exit at ${vars.finishCoord}. All walls are BETWEEN cells. Read every line — the owner cannot see the walls.`,
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