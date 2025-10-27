// src/game/cityPlans.ts - City Plans for Welcome To

import type { CityPlan } from './types';

export const BASIC_PLANS: CityPlan[] = [
  // N1 - 6 estates of size 1
  {
    id: "n1-1",
    objective: "6 estates of size 1",
    type: "estate",
    allow_overlap: false,
    classic: { first: 8, later: 4 },
    balanced: { first: 7, later: 3 }
  },
  {
    id: "n1-2",
    objective: "4 estates of size 2",
    type: "estate",
    allow_overlap: false,
    classic: { first: 8, later: 4 },
    balanced: { first: 8, later: 4 }
  },
  {
    id: "n1-3",
    objective: "3 estates of size 3",
    type: "estate",
    allow_overlap: false,
    classic: { first: 8, later: 4 },
    balanced: { first: 9, later: 5 }
  },
  {
    id: "n1-4",
    objective: "2 estates of size 4",
    type: "estate",
    allow_overlap: false,
    classic: { first: 6, later: 3 },
    balanced: { first: 7, later: 4 }
  },
  {
    id: "n1-5",
    objective: "2 estates of size 5",
    type: "estate",
    allow_overlap: false,
    classic: { first: 8, later: 4 },
    balanced: { first: 10, later: 5 }
  },
  {
    id: "n1-6",
    objective: "2 estates of size 6",
    type: "estate",
    allow_overlap: false,
    classic: { first: 10, later: 6 },
    balanced: { first: 11, later: 7 }
  },

  // N2 - Mixed estates
  {
    id: "n2-1",
    objective: "1 estate size 3 and 1 estate size 6",
    type: "estate",
    allow_overlap: false,
    classic: { first: 8, later: 4 },
    balanced: { first: 9, later: 5 }
  },
  {
    id: "n2-2",
    objective: "2 estates size 3 and 1 estate size 4",
    type: "estate",
    allow_overlap: false,
    classic: { first: 12, later: 7 },
    balanced: { first: 12, later: 7 }
  },
  {
    id: "n2-3",
    objective: "1 estate size 4 and 1 estate size 5",
    type: "estate",
    allow_overlap: false,
    classic: { first: 9, later: 5 },
    balanced: { first: 10, later: 6 }
  },
  {
    id: "n2-4",
    objective: "1 estate size 4 and 3 estates size 1",
    type: "estate",
    allow_overlap: false,
    classic: { first: 9, later: 5 },
    balanced: { first: 9, later: 5 }
  },
  {
    id: "n2-5",
    objective: "1 estate size 5 and 2 estates size 2",
    type: "estate",
    allow_overlap: false,
    classic: { first: 10, later: 6 },
    balanced: { first: 11, later: 6 }
  },
  {
    id: "n2-6",
    objective: "1 estate size 6 and 3 estates size 1",
    type: "estate",
    allow_overlap: false,
    classic: { first: 11, later: 6 },
    balanced: { first: 12, later: 7 }
  },

  // N3 - More mixed estates
  {
    id: "n3-1",
    objective: "1 estate size 3 and 1 estate size 4",
    type: "estate",
    allow_overlap: false,
    classic: { first: 7, later: 3 },
    balanced: { first: 8, later: 4 }
  },
  {
    id: "n3-2",
    objective: "1 estate size 2 and 1 estate size 5",
    type: "estate",
    allow_overlap: false,
    classic: { first: 7, later: 3 },
    balanced: { first: 8, later: 4 }
  },
  {
    id: "n3-3",
    objective: "1 estate size 1, 1 estate size 4, 1 estate size 5",
    type: "estate",
    allow_overlap: false,
    classic: { first: 13, later: 7 },
    balanced: { first: 13, later: 8 }
  },
  {
    id: "n3-4",
    objective: "1 estate size 2, 1 estate size 3, 1 estate size 5",
    type: "estate",
    allow_overlap: false,
    classic: { first: 13, later: 7 },
    balanced: { first: 13, later: 8 }
  },
  {
    id: "n3-5",
    objective: "1 estate size 1, 1 estate size 2, 1 estate size 6",
    type: "estate",
    allow_overlap: false,
    classic: { first: 12, later: 7 },
    balanced: { first: 12, later: 7 }
  },
  {
    id: "n3-6",
    objective: "1 estate size 1, 2 estates size 2, 1 estate size 3",
    type: "estate",
    allow_overlap: false,
    classic: { first: 11, later: 6 },
    balanced: { first: 11, later: 6 }
  }
];

export const ADVANCED_PLANS: CityPlan[] = [
  // N1 - Street completion and effects
  {
    id: "a1-1",
    objective: "All 12 houses built in street 3 (full street)",
    type: "street",
    allow_overlap: true,
    classic: { first: 8, later: 4 },
    balanced: { first: 10, later: 5 }
  },
  {
    id: "a1-2",
    objective: "Use 7 Temp Agencies",
    type: "effect",
    allow_overlap: true,
    classic: { first: 6, later: 3 },
    balanced: { first: 7, later: 4 }
  },
  {
    id: "a1-3",
    objective: "All 10 houses built in street 1 (full street)",
    type: "street",
    allow_overlap: true,
    classic: { first: 6, later: 3 },
    balanced: { first: 9, later: 4 }
  },
  {
    id: "a1-4",
    objective: "Use 5 BIS effects",
    type: "effect",
    allow_overlap: true,
    classic: { first: 8, later: 3 },
    balanced: { first: 10, later: 5 }
  },
  {
    id: "a1-5",
    objective: "First and last house in every street are built",
    type: "street",
    allow_overlap: true,
    classic: { first: 7, later: 4 },
    balanced: { first: 7, later: 4 }
  },

  // N2 - Pools, parks, and special conditions
  {
    id: "a2-1",
    objective: "Two streets each have 3 completed pools (6 total)",
    type: "pool",
    allow_overlap: true,
    classic: { first: 7, later: 4 },
    balanced: { first: 10, later: 5 }
  },
  {
    id: "a2-2",
    objective: "All pools and parks built in street 3",
    type: "street",
    allow_overlap: true,
    classic: { first: 10, later: 5 },
    balanced: { first: 11, later: 6 }
  },
  {
    id: "a2-3",
    objective: "All pools and parks built in street 2",
    type: "street",
    allow_overlap: true,
    classic: { first: 8, later: 3 },
    balanced: { first: 9, later: 5 }
  },
  {
    id: "a2-4",
    objective: "One street has all pools, all parks, and one roundabout",
    type: "street",
    allow_overlap: true,
    classic: { first: 10, later: 5 },
    balanced: { first: 12, later: 6 }
  },
  {
    id: "a2-5",
    objective: "All parks or all pools completed in two different streets",
    type: "street",
    allow_overlap: true,
    classic: { first: 7, later: 4 },
    balanced: { first: 9, later: 5 }
  }
];

export function getRandomCityPlans(count: number = 3): CityPlan[] {
  const allPlans = [...BASIC_PLANS, ...ADVANCED_PLANS];
  const shuffled = [...allPlans].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
