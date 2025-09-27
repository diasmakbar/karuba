export type Reward = "gold" | "crystal" | null;

/**
 * Generate fair rewards for all tiles.
 * - 36 tiles dibagi jadi 3 batch (12 tile).
 * - Tiap batch ada 5 tile berisi reward.
 * - Reward random antara "gold" atau "crystal".
 * - Sisanya null.
 */
export function assignRewards(totalTiles: number = 36): Record<number, Reward> {
  const rewards: Record<number, Reward> = {};
  const batches = Math.ceil(totalTiles / 12);

  for (let b = 0; b < batches; b++) {
    const start = b * 12 + 1; // tile nomor mulai batch
    const end = start + 11;   // tile nomor akhir batch

    // ambil 5 index unik random dari 12 tile batch
    const indices = shuffle([...Array(12).keys()]).slice(0, 5);

    for (let i = 0; i < 12; i++) {
      const tileNum = start + i;
      if (indices.includes(i)) {
        // Random pilih gold atau crystal
        rewards[tileNum] = Math.random() < 0.5 ? "gold" : "crystal";
      } else {
        rewards[tileNum] = null;
      }
    }
  }

  return rewards;
}

/** Utility: Fisher–Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
