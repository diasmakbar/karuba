export type GameStatus = "waiting" | "playing" | "ended";

export type StreetId = 1 | 2 | 3;

export interface HouseSlot {
  number?: number; // house number 1-15, undefined if empty
  poolPosition?: boolean; // true if this position can have a pool
  hasPool?: boolean; // true if pool is built here
  hasPark?: boolean;
  hasFence?: boolean; // fence after this house
}

export type Street = HouseSlot[];

export interface PlayerBoard {
  street1: Street; // 10 house slots
  street2: Street; // 11 house slots
  street3: Street; // 12 house slots
  parkSlots: {
    street1: boolean[]; // 3 park slots
    street2: boolean[]; // 4 park slots
    street3: boolean[]; // 5 park slots
  };
}

export type EffectType =
  | "pool"
  | "temp"
  | "bis"
  | "landscaper"
  | "realEstate"
  | "surveyor";

export interface ConstructionCard {
  id: number;
  number?: number; // 1-15 if number side
  effect?: EffectType; // if effect side
}

export interface CityPlan {
  id: string;
  objective: string;
  type: "estate" | "street" | "pool" | "effect";
  allow_overlap: boolean;
  classic: { first: number; later: number };
  balanced: { first: number; later: number };
}

export interface CompletedPlan {
  planId: string;
  playerId: string;
  points: number;
}

export interface Player {
  id: string;
  name: string;
  joinedAt: number;
  board: PlayerBoard;
  score: number;
  tempUsed: number; // count of temp agency used
  bisUsed: number; // count of BIS used
  buildingRefusals: number; // count of refusals
  completedPlans: CompletedPlan[];
  actedThisTurn: boolean;
  readyForNext: boolean;
}

export interface Game {
  id: string;
  status: GameStatus;
  statusText: string;
  createdAt: number;
  hostId: string;
  mode: "classic" | "balanced";
  includeAdvanced: boolean;
  maxPlayers: number;

  round: number;
  currentCard: ConstructionCard | null;
  deck: number[]; // card ids
  discarded: number[];

  cityPlans: CityPlan[];
  completedPlans: CompletedPlan[];

  playersCount: number;
  players?: Record<string, Player>;
}
