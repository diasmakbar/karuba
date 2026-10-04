import type { ModuleConfig } from "../contract";

export const SHIPS = [
  "Ship Alpha",
  "Ship Bravo",
  "Ship Charlie",
  "Ship Delta",
  "Ship Echo",
  "Ship Foxtrot",
  "Ship Golf",
  "Ship Hotel",
] as const;

export const ARTILLERY_SHOTS = [
  "Shot #1",
  "Shot #2",
  "Shot #3",
  "Shot #4",
  "Shot #5",
  "Shot #6",
  "Shot #7",
  "Shot #8",
] as const;

export const mod12BattleshipConfig: ModuleConfig<"MOD_12_BATTLESHIP"> = {
  id: "MOD_12_BATTLESHIP",
  name: "Battleship",
  kind: "Coordinate Intersection",
  rules: {
    ships: SHIPS,
    shots: ARTILLERY_SHOTS,
    ownerPrompt: "Report the one coordinate occupied by the named target ship and struck by the incoming shot.",
    informant1: "Each ship's coordinates; do not reveal which ship is the target.",
    informant2: "Each shot's hit coordinates; do not reveal which shot is incoming.",
  },
};
