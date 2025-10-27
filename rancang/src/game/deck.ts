// src/game/deck.ts - Construction Card Deck for Welcome To

import type { ConstructionCard, EffectType } from './types';

// Number distribution: 3x 1,2,14,15; 4x 3,13; 5x 4,12; 6x 5,11; 7x 6,10; 8x 7,9; 9x 8
const NUMBER_DISTRIBUTION: Record<number, number> = {
  1: 3, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 8, 10: 7, 11: 6, 12: 5, 13: 4, 14: 3, 15: 3
};

// Effect distribution: 9x pool, temp-agency, bis; 18x landscaper, real-estate-agent, surveyor
const EFFECT_DISTRIBUTION: Record<EffectType, number> = {
  'pool': 9,
  'temp-agency': 9,
  'bis': 9,
  'landscaper': 18,
  'real-estate-agent': 18,
  'surveyor': 18
};

export function createDeck(): ConstructionCard[] {
  const deck: ConstructionCard[] = [];

  // Add number cards
  Object.entries(NUMBER_DISTRIBUTION).forEach(([numStr, count]) => {
    const number = parseInt(numStr);
    for (let i = 0; i < count; i++) {
      deck.push({
        id: `number-${number}-${i}`,
        type: 'number',
        number
      });
    }
  });

  // Add effect cards
  Object.entries(EFFECT_DISTRIBUTION).forEach(([effect, count]) => {
    for (let i = 0; i < count; i++) {
      deck.push({
        id: `${effect}-${i}`,
        type: 'effect',
        effect: effect as EffectType
      });
    }
  });

  return shuffleDeck(deck);
}

export function shuffleDeck(deck: ConstructionCard[]): ConstructionCard[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function drawCards(deck: ConstructionCard[], count: number): { drawn: ConstructionCard[], remaining: ConstructionCard[] } {
  const drawn = deck.slice(0, count);
  const remaining = deck.slice(count);
  return { drawn, remaining };
}

export function dealHands(deck: ConstructionCard[], playerCount: number): { hands: ConstructionCard[][], remaining: ConstructionCard[] } {
  const hands: ConstructionCard[][] = Array.from({ length: playerCount }, () => []);
  const cardsPerPlayer = Math.floor(deck.length / playerCount);

  for (let i = 0; i < cardsPerPlayer; i++) {
    for (let j = 0; j < playerCount; j++) {
      if (deck.length > 0) {
        hands[j].push(deck.shift()!);
      }
    }
  }

  return { hands, remaining: deck };
}
