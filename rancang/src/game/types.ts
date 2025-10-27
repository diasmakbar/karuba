// src/game/types.ts - Welcome To: Your Perfect Home

export type StreetType = 'A' | 'B' | 'C';

export interface House {
  number: number | null; // house number (1-15) or null if empty
  hasPool: boolean;
  hasPark: boolean;
  hasFence: boolean; // for estate boundaries
}

export interface Street {
  type: StreetType;
  houses: House[]; // length: A=10, B=11, C=12
}

export type CardType = 'number' | 'effect';

export type EffectType = 'pool' | 'temp-agency' | 'bis' | 'landscaper' | 'real-estate-agent' | 'surveyor';

export interface ConstructionCard {
  id: string;
  type: CardType;
  number?: number; // 1-15 for number cards
  effect?: EffectType; // for effect cards
}

export interface CityPlan {
  id: string;
  objective: string;
  type: 'estate' | 'street' | 'pool' | 'park' | 'effect';
  allow_overlap: boolean;
  classic: {
    first: number;
    later: number;
  };
  balanced: {
    first: number;
    later: number;
  };
}

export interface Estate {
  startIndex: number;
  endIndex: number;
  street: StreetType;
  size: number;
}

export const PLAYER_COLORS = [
  { color: '#BF092F', textColor: 'white' },
  { color: '#4E61D3', textColor: 'white' },
  { color: '#11224E', textColor: 'white' },
  { color: '#FF714B', textColor: 'white' },
  { color: '#450693', textColor: 'white' },
  { color: '#016B61', textColor: 'white' },
  { color: '#A6515FFF', textColor: 'white' },
  { color: '#DDA853', textColor: 'white' },
];

export interface Player {
  id: string;
  name: string;
  color: string;
  streets: Record<StreetType, Street>;
  hand: ConstructionCard[];
  cityPlans: CityPlan[];
  completedPlans: string[]; // plan IDs
  tempAgencyUses: number;
  bisCount: number;
  buildingPermitRefusals: number;
  score: number;
}

export type GameMode = 'classic' | 'balanced';

export type GameStatus = 'lobby' | 'playing' | 'finished';

export interface GameState {
  id: string;
  players: Record<string, Player>;
  currentPlayer: string;
  deck: ConstructionCard[];
  discardPile: ConstructionCard[];
  round: number;
  status: GameStatus;
  mode: GameMode;
  availablePlans: CityPlan[];
  startTime: number;
}
