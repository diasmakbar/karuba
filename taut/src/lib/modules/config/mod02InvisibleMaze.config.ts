import type { Direction, MazeId } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Invisible Maze module (MOD_02).
 *
 * Grid shape, maze layouts and the D-pad rotation rules are all data. Add a new maze by
 * appending an id + its walls here; no change to `mod02InvisibleMaze.ts` is required
 * beyond the (existing) maze union in the DB schema.
 */

export const MAZE_COLUMNS = ["A", "B", "C", "D", "E", "F"] as const;
export const MAZE_ROWS = [1, 2, 3, 4, 5, 6] as const;

/**
 * Walls are always on the EDGES between two cells — never "solid cells". A cell is only
 * impassable because every edge leading into it is walled, so the token can always find a way
 * around obstacles instead of being boxed in.
 *
 * Each entry `"<from>|<to>"` blocks movement between two orthogonally adjacent cells.
 */
export const WALLED_EDGES: Record<MazeId, readonly string[]> = {
  Alpha: [
    "A1|A2", "B1|C1", "C1|C2", "D2|E2", "E1|F1", "F2|F3",
    "A3|B3", "B3|B4", "C3|D3", "D3|D4", "E4|F4", "A5|A6", "C5|C6", "D5|E5",
  ],
  Beta: [
    "A2|B2", "B2|B3", "C1|D1", "E2|E3", "D3|D4", "E3|F3",
    "B4|C4", "A5|B5", "C5|D5", "E4|F4", "E5|E6", "F5|F6",
  ],
  Gamma: [
    "A1|B1", "A2|A3", "C2|D2", "B3|C3", "D3|E3", "E2|E3",
    "F1|F2", "A4|B4", "B4|B5", "B5|C5", "D5|D6", "E5|F5",
  ],
};

/** Mazes the module can deal. */
export const MAZE_IDS: readonly MazeId[] = ["Alpha", "Beta", "Gamma"];

/** Info2_Modifier: serialNumber-based control rotation (even / odd last digit). */
export const ROTATION_MAP: Record<Direction, Record<"even" | "odd", Direction>> = {
  UP: { even: "LEFT", odd: "RIGHT" },
  RIGHT: { even: "UP", odd: "DOWN" },
  DOWN: { even: "RIGHT", odd: "LEFT" },
  LEFT: { even: "DOWN", odd: "UP" },
};

export const mod02InvisibleMazeConfig: ModuleConfig<"MOD_02_INVISIBLE_MAZE"> = {
  id: "MOD_02_INVISIBLE_MAZE",
  name: "Invisible Maze",
  kind: "Pathfinding Component",
  rules: {
    columns: MAZE_COLUMNS,
    rows: MAZE_ROWS,
    mazes: MAZE_IDS,
    walledEdges: WALLED_EDGES,
    rotationMap: ROTATION_MAP,
    infoNotes: {
      info1:
        "Thick lines are walls between cells. A token is guided step by step from the start to the exit.",
      info2:
        "Ask the owner for the last digit of their serial number, then read them the matching row.",
    },
  },
};
