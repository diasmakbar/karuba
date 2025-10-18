// src/game/config.ts

import type { Attraction, AttractionSize } from './types';

// --- Atraksi lengkap berdasarkan ukuran ---
const ATTRACTIONS_BY_SIZE: Record<AttractionSize, string[]> = {
  3: ['rest-area', 'minimarket', 'tempat-ibadah'],
  4: ['taman', 'bioskop', 'lapangan-olahraga'],
  5: ['gedung-bisnis', 'waterboom', 'apartemen'],
};

// Hitung total atraksi berdasarkan jumlah pemain
export function getTotalAttractionCount(playerCount: number): number {
  if (playerCount <= 3) return 27;   // 1 set
  if (playerCount <= 5) return 72;   // 2 set
  if (playerCount <= 7) return 108;  // 3 set
  return 144;                        // 4 set (8-9 pemain)
}

// Generate daftar atraksi lengkap (bisa di-shuffle nanti)
export function generateAllAttractions(playerCount: number): Attraction[] {
  const total = getTotalAttractionCount(playerCount);
  const attractions: Attraction[] = [];

  const setSize = (playerCount <= 3) ? 1 :
                  (playerCount <= 5) ? 2 :
                  (playerCount <= 7) ? 3 : 4;

  for (let set = 0; set < setSize; set++) {
    for (const size of [3, 4, 5] as const) {
      for (const type of ATTRACTIONS_BY_SIZE[size]) {
        attractions.push({ size, type: type as any });
      }
    }
  }

  // Potong sesuai total (misal 27, 72, dll)
  return attractions.slice(0, total);
}

// Hitung jumlah tile maksimal
export function getMaxTileCount(playerCount: number): number {
  const n = playerCount + 4;
  return Math.min(n * n, 150);
}

// Aturan distribusi per ronde & jumlah pemain
export function getRoundRules(playerCount: number) {
  if (playerCount <= 3) {
    return [
      { land: 7 - 2, attractions: 6 },
      { land: 7 - 2, attractions: 6 },
      { land: 8 - 2, attractions: 5 },
      { land: 8 - 2, attractions: 5 },
    ];
  } else if (playerCount <= 5) {
    return [
      { land: 6 - 2, attractions: 4 },
      { land: 6 - 2, attractions: 4 },
      { land: 7 - 2, attractions: 3 },
      { land: 7 - 2, attractions: 3 },
    ];
  } else if (playerCount <= 7) {
    return [
      { land: 5 - 2, attractions: 3 },
      { land: 5 - 2, attractions: 3 },
      { land: 6 - 2, attractions: 2 },
      { land: 6 - 2, attractions: 2 },
    ];
  } else {
    // Untuk 8-9 pemain, bisa tambah aturan
    return [
      { land: 4 - 2, attractions: 2 },
      { land: 4 - 2, attractions: 2 },
      { land: 5 - 2, attractions: 1 },
      { land: 5 - 2, attractions: 1 },
    ];
  }
}