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

export interface Player {
  id: string;
  name: string;
  coins: number;
  tiles: number[];              // array nomor tile yang dimiliki
  attractions: Attraction[];    // kartu atraksi di tangan
  doneNegotiating: boolean;
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
