import type { CityPlan } from "./types";

export const CITY_PLANS: CityPlan[] = [
  // Basic plans
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
  },
  // Advanced plans
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

export function getRandomCityPlans(includeAdvanced: boolean): CityPlan[] {
  // Pick 1 from each basic subgroup: n1, n2, n3
  const n1Plans = CITY_PLANS.filter(p => p.id.startsWith('n1'));
  const n2Plans = CITY_PLANS.filter(p => p.id.startsWith('n2'));
  const n3Plans = CITY_PLANS.filter(p => p.id.startsWith('n3'));

  const pickRandom = (plans: CityPlan[]) =>
    plans[Math.floor(Math.random() * plans.length)];

  const basicPlans = [
    pickRandom(n1Plans),
    pickRandom(n2Plans),
    pickRandom(n3Plans)
  ];

  let advancedPlans: CityPlan[] = [];
  if (includeAdvanced) {
    // Pick 1 from a1 and 1 from a2
    const a1Plans = CITY_PLANS.filter(p => p.id.startsWith('a1'));
    const a2Plans = CITY_PLANS.filter(p => p.id.startsWith('a2'));

    advancedPlans = [
      pickRandom(a1Plans),
      pickRandom(a2Plans)
    ];
  }

  return [...basicPlans, ...advancedPlans];
}
