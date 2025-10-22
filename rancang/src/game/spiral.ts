// src/game/spiral.ts

export interface Cell {
  n: number;
  x: number;
  y: number;
}

// Generate spiral grid starting from center
export function generateSpiralGrid(nMax: number): Cell[] {
  let x = 0, y = 0;
  let dx = 1, dy = 0;
  let steps = 1;
  let n = 1;

  const out: Cell[] = [{ n, x, y }];
  n++;

  while (n <= nMax) {
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < steps; j++) {
        if (n > nMax) break;
        x += dx;
        y += dy;
        out.push({ n, x, y });
        n++;
      }
      // Turn right
      [dx, dy] = [-dy, dx];
    }
    steps++;
  }

  // Apply offset for odd-even rows (hex-like)
  return out.map((cell) =>
    cell.y % 2 !== 0 ? { ...cell, x: cell.x + 0.5 } : cell
  );
}

// Check if two tiles are adjacent in the spiral grid
export function areAdjacent(n1: number, n2: number, cells: Cell[]): boolean {
  if (n1 === n2) return false;
  const c1 = cells.find(c => c.n === n1);
  const c2 = cells.find(c => c.n === n2);
  if (!c1 || !c2) return false;

  const dx = Math.abs(c1.x - c2.x);
  const dy = Math.abs(c1.y - c2.y);

  // Due to offset, check for neighboring positions
  // Adjacent if |dx| <= 1 and |dy| <= 1, but not self, and not if dx=0 and dy=0
  // But since offset 0.5, dx=0.5 means neighbor
  // Also diagonals are possible

  // Possible deltas: (0,1), (1,0), (0,-1), (-1,0), and due to offset: (0.5,1), (-0.5,1), (0.5,-1), (-0.5,-1), etc.
  // For simplicity, if max(|dx|, |dy|) <= 1.2 or so, but better to list possible

  const possibleDXDY = [
    [0, 1], [1, 0], [0, -1], [-1, 0],
    [0.5, 1], [-0.5, 1], [0.5, -1], [-0.5, -1],
    [1.5, 0], [1.5, 1], [1.5, -1], // extreme but possible
    [-1.5, 0], [-1.5, 1], [-1.5, -1],
  ];

  return possibleDXDY.some(([dtx, dty]) =>
    Math.abs(dx - dtx) < 0.1 && Math.abs(dy - dty) < 0.1
  );
}

// Find connected components (clusters) of built tiles
export function findClusters(tiles: Record<number, boolean>, cells: Cell[]): number[][] {
  const visited = new Set<number>();
  const clusters: number[][] = [];

  for (const [n, built] of Object.entries(tiles)) {
    const numTile = parseInt(n);
    if (!built || visited.has(numTile)) continue;

    const cluster: number[] = [];
    const stack = [numTile];
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);
      cluster.push(current);

      // Find adjacent built tiles
      for (let i = 1; i <= cells.length; i++) {
        if (tiles[i] && !visited.has(i) && areAdjacent(current, i, cells)) {
          stack.push(i);
        }
      }
    }

    if (cluster.length > 0) clusters.push(cluster);
  }

  return clusters;
}
