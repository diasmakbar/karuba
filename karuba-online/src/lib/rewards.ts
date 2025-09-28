import type { RewardsMap } from "./types"

// Contoh: 36 tile dibagi 3 batch (12/12/12); tiap batch 5 reward acak
// Nilai reward: crystal / gold dipilih acak setengah-setengah
export function makeRewards(): RewardsMap {
  const pickFrom = (ids: number[], k: number) => {
    const pool = [...ids]
    const out: number[] = []
    for (let i = 0; i < k && pool.length; i++) {
      const j = Math.floor(Math.random() * pool.length)
      out.push(pool[j])
      pool.splice(j, 1)
    }
    return out
  }

  const batches: number[][] = [
    Array.from({ length: 12 }, (_, i) => i + 1),
    Array.from({ length: 12 }, (_, i) => i + 13),
    Array.from({ length: 12 }, (_, i) => i + 25),
  ]

  const rewards: RewardsMap = {}
  for (const b of batches) {
    const hits = pickFrom(b, 3)
    for (const id of b) rewards[id] = null
    for (const id of hits) {
      rewards[id] = Math.random() < 0.5 ? "crystal" : "gold"
    }
  }
  return rewards
}


// type Reward = "gold" | "crystal" | null;

// /**
//  * Bagi 36 tile jadi 3 batch (12-12).
//  * Dalam tiap batch ada 5 tile yang dapat reward.
//  * Reward random antara gold / crystal.
//  */
// export function assignRewards(totalTiles: number = 36): Record<number, Reward> {
//   const rewards: Record<number, Reward> = {};
//   const batches = Math.ceil(totalTiles / 12);

//   for (let b = 0; b < batches; b++) {
//     const start = b * 12 + 1;
//     const end = start + 11;

//     // ambil 5 random index unik dalam 12
//     const indices = shuffle([...Array(12).keys()]).slice(0, 5);

//     for (let i = 0; i < 12; i++) {
//       const tileNum = start + i;
//       if (indices.includes(i)) {
//         // Random pilih gold/crystal
//         rewards[tileNum] = Math.random() < 0.5 ? "gold" : "crystal";
//       } else {
//         rewards[tileNum] = null;
//       }
//     }
//   }

//   return rewards;
// }

// function shuffle<T>(arr: T[]): T[] {
//   for (let i = arr.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [arr[i], arr[j]] = [arr[j], arr[i]];
//   }
//   return arr;
// }
