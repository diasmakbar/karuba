import type { ModuleDefinition } from "./contract";
import { GRID_COLUMNS } from "../rng";
import type { Rng } from "../rng";
import { battleshipGridSize } from "../gameConfig";
import { ARTILLERY_SHOTS, SHIPS, mod12BattleshipConfig } from "./config/mod12Battleship.config";

const MAX_GENERATION_ATTEMPTS = 500;

function coordinate(columnIndex: number, row: number): string {
  return `${GRID_COLUMNS[columnIndex]}${row}`;
}

/** Return the unique coordinate shared by a ship and shot; null means zero or multiple hits. */
export function battleshipIntersection(
  ship: string,
  shot: string,
  shipDeployments: Record<string, string[]>,
  shotTrajectories: Record<string, string[]>,
): string | null {
  const deployed = new Set(shipDeployments[ship] ?? []);
  const overlap = (shotTrajectories[shot] ?? []).filter((cell) => deployed.has(cell));
  return overlap.length === 1 ? overlap[0] : null;
}

export function isContiguousStraightLine(cells: string[]): boolean {
  if (cells.length < 2) return false;
  const parsed = cells.map((cell) => ({
    col: GRID_COLUMNS.indexOf(cell.match(/^[A-Z]+/)?.[0] as (typeof GRID_COLUMNS)[number]),
    row: Number(cell.match(/\d+$/)?.[0]),
  }));
  if (parsed.some(({ col, row }) => col < 0 || !Number.isInteger(row) || row < 1)) return false;
  const sameRow = parsed.every((cell) => cell.row === parsed[0].row);
  const sameColumn = parsed.every((cell) => cell.col === parsed[0].col);
  if (!sameRow && !sameColumn) return false;
  const axis = (sameRow ? parsed.map((cell) => cell.col) : parsed.map((cell) => cell.row)).sort((a, b) => a - b);
  return axis.every((value, index) => index === 0 || value === axis[index - 1] + 1);
}

function randomLine(rng: Rng, n: number, minLength = 2, maxLength = 4): string[] {
  const horizontal = rng.bool();
  const length = minLength + rng.int(Math.min(maxLength - minLength + 1, n - minLength + 1));
  const startCol = rng.int(horizontal ? n - length + 1 : n);
  const startRow = rng.int(horizontal ? n : n - length + 1) + 1;
  return Array.from({ length }, (_, offset) => coordinate(startCol + (horizontal ? offset : 0), startRow + (horizontal ? 0 : offset)));
}

function randomShot(rng: Rng, n: number): string[] {
  if (rng.bool()) return randomLine(rng, n, 2, Math.min(5, n));
  const centerCol = rng.int(n);
  const centerRow = rng.int(n) + 1;
  const cells: string[] = [];
  for (let dc = -1; dc <= 1; dc += 1) {
    for (let dr = -1; dr <= 1; dr += 1) {
      if (Math.abs(dc) + Math.abs(dr) > 1) continue;
      const col = centerCol + dc;
      const row = centerRow + dr;
      if (col >= 0 && col < n && row >= 1 && row <= n) cells.push(coordinate(col, row));
    }
  }
  return cells;
}

function makeBoard(rng: Rng, n: number): { shipDeployments: Record<string, string[]>; shotTrajectories: Record<string, string[]> } | null {
  const shipDeployments: Record<string, string[]> = {};
  const shotTrajectories: Record<string, string[]> = {};
  const occupied = new Set<string>();

  for (const ship of SHIPS) {
    let deployment: string[] | undefined;
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const candidate = randomLine(rng, n, 2, 4);
      if (candidate.every((cell) => !occupied.has(cell))) {
        deployment = candidate;
        break;
      }
    }
    if (!deployment) return null;
    shipDeployments[ship] = deployment;
    deployment.forEach((cell) => occupied.add(cell));
  }

  for (const shot of ARTILLERY_SHOTS) shotTrajectories[shot] = randomShot(rng, n);
  return { shipDeployments, shotTrajectories };
}

function boardHasValidShips(shipDeployments: Record<string, string[]>): boolean {
  return SHIPS.every((ship) => isContiguousStraightLine(shipDeployments[ship] ?? []));
}

export const mod12Battleship: ModuleDefinition<"MOD_12_BATTLESHIP"> = {
  config: mod12BattleshipConfig,
  id: mod12BattleshipConfig.id,
  name: mod12BattleshipConfig.name,
  kind: mod12BattleshipConfig.kind,
  generate: (rng: Rng, difficulty) => {
    const gridSize = battleshipGridSize(difficulty);
    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
      const board = makeBoard(rng, gridSize);
      if (!board || !boardHasValidShips(board.shipDeployments)) continue;
      const targetShip = rng.pick(SHIPS);
      const incomingShot = rng.pick(ARTILLERY_SHOTS);
      // Re-roll the entire board and pair unless their coordinate sets intersect exactly once.
      if (battleshipIntersection(targetShip, incomingShot, board.shipDeployments, board.shotTrajectories) !== null) {
        return { targetShip, incomingShot, gridSize, ...board };
      }
    }
    throw new Error(`Failed to generate a Battleship board satisfying the one-hit invariant in ${MAX_GENERATION_ATTEMPTS} attempts`);
  },
  info1: (vars) => [{
    title: "Ship deployments (Info 1)",
    columns: ["Ship", "Occupied coordinates"],
    rows: Object.entries(vars.shipDeployments).map(([ship, cells]) => ({ cells: [ship, cells.join(", ")], highlight: false })),
    note: "Each ship occupies a contiguous horizontal or vertical run. Ask the owner which ship is the target.",
  }],
  info2: (vars) => [{
    title: "Artillery trajectories (Info 2)",
    columns: ["Incoming shot", "Coordinates hit"],
    rows: Object.entries(vars.shotTrajectories).map(([shot, cells]) => ({ cells: [shot, cells.join(", ")], highlight: false })),
    note: "Shot coordinates are listed here. Ask the owner which shot is incoming.",
  }],
  verify: (vars, answer) => answer.coord === battleshipIntersection(vars.targetShip, vars.incomingShot, vars.shipDeployments, vars.shotTrajectories),
  status: () => "Select the single coordinate shared by the target ship and incoming shot",
};
