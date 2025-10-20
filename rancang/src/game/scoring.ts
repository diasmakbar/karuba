import type { Attraction } from './types';

// Assume tiles are in a grid, but for simplicity, use adjacency based on numbers
// In real spiral, adjacent if |dx| + |dy| = 1 in spiral coords

// Simple mock: assume tiles 1-81, adjacent if differ by 1 or something
// For now, mock scoring

export function calculateScore(attractions: Attraction[]): number {
  // Mock: group by size
  const bySize: Record<number, Attraction[]> = { 3: [], 4: [], 5: [] };
  attractions.forEach(attr => bySize[attr.size].push(attr));

  let score = 0;
  for (const size in bySize) {
    const count = bySize[size].length;
    if (count === 0) continue;
    if (count === 1) score += 1;
    else if (count === 2) score += 3;
    else if (count === 3) score += 5;
    else if (count === 4) score += 7;
    else if (count === 5) score += 12;
    // Bonus for complete set
    if (count >= parseInt(size)) score += 1; // mock
  }

  return score;
}
