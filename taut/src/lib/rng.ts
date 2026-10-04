/** Small random helpers used by host-side module generation. */

export interface Rng {
  /** Integer in [0, maxExclusive). */
  int: (maxExclusive: number) => number;
  /** Random element of a non-empty list. */
  pick: <T>(items: readonly T[]) => T;
  bool: () => boolean;
  /** Fisher-Yates copy. */
  shuffle: <T>(items: readonly T[]) => T[];
}

export function createRng(): Rng {
  const int = (maxExclusive: number) => Math.floor(Math.random() * maxExclusive);
  return {
    int,
    pick: <T>(items: readonly T[]) => items[int(items.length)],
    bool: () => Math.random() < 0.5,
    shuffle: <T>(items: readonly T[]) => {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = int(i + 1);
        const swap = copy[i];
        copy[i] = copy[j];
        copy[j] = swap;
      }
      return copy;
    },
  };
}

/** 3-digit serial number, e.g. "417". */
export function randomSerialNumber(rng: Rng): string {
  return String(rng.int(900) + 100);
}

/** Shared rule used by several modules (MOD_01, MOD_03, MOD_06, MOD_07, MOD_10). */
export function endsWithEven(serialNumber: string): boolean {
  const last = Number(serialNumber.slice(-1));
  return Number.isFinite(last) && last % 2 === 0;
}

/** Grid coordinate helpers: columns A-J, rows 1-10 (MOD_12 Battleship uses up to 10x10). */
export const GRID_COLUMNS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] as const;
export const GRID_ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function coordFrom(columnIndex: number, rowIndex: number): string {
  return `${GRID_COLUMNS[columnIndex]}${GRID_ROWS[rowIndex]}`;
}

export function parseCoord(coord: string): { col: number; row: number } {
  const col = GRID_COLUMNS.indexOf(coord.charAt(0) as (typeof GRID_COLUMNS)[number]);
  const row = Number(coord.slice(1)) - 1;
  return { col, row };
}

export function clampIndex(value: number, size: number): number {
  return Math.min(size - 1, Math.max(0, value));
}

/** Distinct random ids from `pool`, preferring ids that are not `exclude`. */
export function pickDistinct<T>(rng: Rng, pool: readonly T[], count: number, exclude?: T): T[] {
  const preferred = rng.shuffle(pool.filter((item) => item !== exclude));
  const fallback = rng.shuffle(pool);
  const picked: T[] = [];
  for (const source of [preferred, fallback]) {
    for (const item of source) {
      if (picked.length >= count) break;
      if (!picked.includes(item)) picked.push(item);
    }
  }
  return picked.slice(0, count);
}
