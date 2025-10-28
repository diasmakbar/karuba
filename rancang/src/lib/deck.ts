import type { ConstructionCard } from "./types";

export const CONSTRUCTION_CARDS: ConstructionCard[] = [
  // Numbers: 3x 1,2,14,15; 4x 3,13; 5x 4,12; 6x 5,11; 7x 6,10; 8x 7,9; 9x 8
  ...Array(3).fill(null).map((_, i) => ({ id: i + 1, number: 1 })),
  ...Array(3).fill(null).map((_, i) => ({ id: i + 4, number: 2 })),
  ...Array(4).fill(null).map((_, i) => ({ id: i + 7, number: 3 })),
  ...Array(5).fill(null).map((_, i) => ({ id: i + 11, number: 4 })),
  ...Array(6).fill(null).map((_, i) => ({ id: i + 16, number: 5 })),
  ...Array(7).fill(null).map((_, i) => ({ id: i + 22, number: 6 })),
  ...Array(8).fill(null).map((_, i) => ({ id: i + 29, number: 7 })),
  ...Array(9).fill(null).map((_, i) => ({ id: i + 37, number: 8 })),
  ...Array(8).fill(null).map((_, i) => ({ id: i + 46, number: 9 })),
  ...Array(7).fill(null).map((_, i) => ({ id: i + 54, number: 10 })),
  ...Array(6).fill(null).map((_, i) => ({ id: i + 61, number: 11 })),
  ...Array(5).fill(null).map((_, i) => ({ id: i + 67, number: 12 })),
  ...Array(4).fill(null).map((_, i) => ({ id: i + 72, number: 13 })),
  ...Array(3).fill(null).map((_, i) => ({ id: i + 76, number: 14 })),
  ...Array(3).fill(null).map((_, i) => ({ id: i + 79, number: 15 })),

  // Effects: 9 pool, 9 temp, 9 bis, 18 landscaper, 18 realEstate, 18 surveyor
  ...Array(9).fill(null).map((_, i) => ({ id: i + 82, effect: "pool" as const })),
  ...Array(9).fill(null).map((_, i) => ({ id: i + 91, effect: "temp" as const })),
  ...Array(9).fill(null).map((_, i) => ({ id: i + 100, effect: "bis" as const })),
  ...Array(18).fill(null).map((_, i) => ({ id: i + 109, effect: "landscaper" as const })),
  ...Array(18).fill(null).map((_, i) => ({ id: i + 127, effect: "realEstate" as const })),
  ...Array(18).fill(null).map((_, i) => ({ id: i + 145, effect: "surveyor" as const })),
];

export function shuffleDeck(): number[] {
  const ids = CONSTRUCTION_CARDS.map(card => card.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

export function getCardById(id: number): ConstructionCard | undefined {
  return CONSTRUCTION_CARDS.find(card => card.id === id);
}
