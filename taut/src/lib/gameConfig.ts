import type { Difficulty } from "../types/db-schema";

export interface DifficultyConfig {
  label: string;
  blurb: string;
  /** How many levels of "one module per player" to run (1 for the easiest). */
  levels: number;
  /** Countdown length per level; stored as `globalEndTime` so no client writes timers. */
  timePerLevelSeconds: number;
  maxStrikes: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  BEGINNER: {
    label: "Beginner",
    blurb: "1 module each, 1 level, 8 minutes, 6 strikes",
    levels: 1,
    timePerLevelSeconds: 8 * 60,
    maxStrikes: 6,
  },
  STANDARD: {
    label: "Standard",
    blurb: "1 module each, 2 levels, 5 minutes each, 4 strikes",
    levels: 2,
    timePerLevelSeconds: 5 * 60,
    maxStrikes: 4,
  },
  EXTREME: {
    label: "Extreme",
    blurb: "1 module each, 2 levels, 4 minutes each, 2 strikes",
    levels: 2,
    timePerLevelSeconds: 4 * 60,
    maxStrikes: 2,
  },
};

export const DIFFICULTY_IDS: Difficulty[] = ["BEGINNER", "STANDARD", "EXTREME"];

/**
 * How many vocabulary items a module's manual lists for a given difficulty. Beginner rooms show a
 * short 5-item manual; Standard and Extreme show the full 10-item manual.
 */
export function vocabSize(difficulty: Difficulty): number {
  return difficulty === "BEGINNER" ? 5 : 10;
}

/** MOD_13 shape sorter: how many candidate objects to deal (Beginner stays short). */
export function shapeSorterObjectCount(difficulty: Difficulty): number {
  return difficulty === "BEGINNER" ? 2 : 5;
}

/** MOD_07 equalizer: how many sliders/bands to show (Beginner 3, Standard 5, Extreme 7). */
export function equalizerBandCount(difficulty: Difficulty): number {
  if (difficulty === "BEGINNER") return 3;
  if (difficulty === "STANDARD") return 5;
  return 7;
}

/** MOD_10 pressure valves: how many valves to show (Beginner 4, Standard 6, Extreme 8). */
export function valveCount(difficulty: Difficulty): number {
  if (difficulty === "BEGINNER") return 4;
  if (difficulty === "STANDARD") return 6;
  return 8;
}

/** MOD_12 safe zone: grid is NxN (Beginner 3, Standard 4, Extreme 6). */
export function safeZoneGridSize(difficulty: Difficulty): number {
  if (difficulty === "BEGINNER") return 3;
  if (difficulty === "STANDARD") return 4;
  return 6;
}

/**
 * MOD_12 safe zone: how many threats/rooms the manual lists per difficulty
 * (Beginner 3, Standard 5, Extreme 7).
 */
export function safeZoneVocabSize(difficulty: Difficulty): number {
  if (difficulty === "BEGINNER") return 3;
  if (difficulty === "STANDARD") return 5;
  return 7;
}

/** Each player needs two *different* other players as informants, so 3 is the hard minimum. */
export const MIN_PLAYERS_TO_START = 3;
export const MAX_ROOM_NAME_LENGTH = 18;

/** Room keys are 6 digits so they can be read out loud over the table. */
export function randomRoomCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
