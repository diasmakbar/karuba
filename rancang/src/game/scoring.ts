import type { Attraction } from './types';
import { findClusters, generateSpiralGrid } from './spiral';

// Scoring table from README (incomplete vs complete clusters)
const SCORE_TABLE = {
  1: { incomplete: 1 },
  2: { incomplete: 3 },
  3: { incomplete: 5 },
  4: { incomplete: 7 },
  5: { incomplete: 12 },
};

// Complete bonus: compared to incomplete
const COMPLETE_BONUS = {
  3: 1, // 5 -> 6
  4: 2, // 7 -> 9
  5: 0, // already complete at 5=12?
};

// Calculate score for a player based on their built attractions clusters
export function calculateScore(playerTiles: Record<number, Attraction>): number {
  const maxTiles = Math.max(...Object.keys(playerTiles).map(n => parseInt(n))); // rough estimate
  const cells = generateSpiralGrid(maxTiles);

  // Built tiles for this player: those with attraction
  const builtTiles: Record<number, boolean> = {};
  for (let i = 1; i <= maxTiles; i++) {
    builtTiles[i] = i in playerTiles;
  }

  // Find clusters of built tiles
  const clusters = findClusters(builtTiles, cells);

  let totalScore = 0;
  clusters.forEach(cluster => {
    const attractions = cluster.map(n => playerTiles[n]);
    // All attractions in cluster
    const sizes = attractions.map(a => a.size);
    const isComplete = sizes.every(s => s === sizes[0]); // all same size
    const clusterSize = cluster.length;
    if (clusterSize <= 5) {
      const baseScore = SCORE_TABLE[clusterSize as keyof typeof SCORE_TABLE].incomplete;
      const bonus = isComplete && clusterSize >= 3 ? COMPLETE_BONUS[clusterSize as 3 | 4 | 5] || 0 : 0;
      totalScore += baseScore + bonus;
    } else {
      // For >5, assume 12 + more if complete? Not specified, maybe cap at 12
      totalScore += 12;
    }
  });

  return totalScore;
}
