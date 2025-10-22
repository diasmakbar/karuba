// src/game/types.ts

export type AttractionSize = 3 | 4 | 5;

export type AttractionType3 = 'rest-area' | 'minimarket' | 'tempat-ibadah';
export type AttractionType4 = 'taman' | 'bioskop' | 'lapangan-olahraga';
export type AttractionType5 = 'gedung-bisnis' | 'waterboom' | 'apartemen';

export type AttractionType = AttractionType3 | AttractionType4 | AttractionType5;

export interface Attraction {
  size: AttractionSize;
  type: AttractionType;
}

export interface Tile {
  n: number;                    // nomor tile (1, 2, 3, ...)
  owner: string | null;         // uid pemain, atau null
  built: boolean;               // true = tanah sudah "dibangun" (otomatis true saat dibagikan)
  attraction: Attraction | null; // null = belum pasang atraksi
}

export const PLAYER_COLORS = [
  { color: '#e74c3c', textColor: 'white' }, // red
  { color: '#3498db', textColor: 'white' }, // blue
  { color: '#2ecc71', textColor: 'white' }, // green
  { color: '#f39c12', textColor: 'black' }, // yellow
  { color: '#9b59b6', textColor: 'white' }, // purple
  { color: '#1abc9c', textColor: 'white' }, // turquoise
  { color: '#e67e22', textColor: 'white' }, // orange
  { color: '#34495e', textColor: 'white' }, // dark gray
  { color: '#ecf0f1', textColor: 'black' }, // light gray
  { color: '#95a5a6', textColor: 'white' }, // silver
];

export interface Player {
  id: string;
  name: string;
  color: string;                // chosen color
  coins: number;
  tiles: number[];              // array nomor tile yang dimiliki
  attractions: Attraction[];    // kartu atraksi di tangan
  doneNegotiating: boolean;
  builtAttractions?: Record<number, Attraction>; // tile -> attraction built
}

export type GameStatus = 'lobby' | 'distributing' | 'negotiation' | 'scoring' | 'finished';

export interface GameConfig {
  playerCount: number;
  maxTiles: number;
  currentRound: number;
  totalRounds: 4;
  status: GameStatus;
  statusText: string;
  negotiationEndTime: number | null; // timestamp (ms)
}
