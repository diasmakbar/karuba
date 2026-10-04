import type { RoomHazard, Threat } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Safe Zone module (MOD_12).
 *
 * SEMANTICS: INCLUSION / VENN INTERSECTION. Each threat covers a set of cells and each room
 * covers a set of cells. The answer is the single cell in BOTH sets (the intersection), NOT the
 * uncovered/eliminated cell.
 *
 * Grid size and vocabulary scale with difficulty (see `safeZoneGridSize` / `safeZoneVocabSize`
 * in `lib/gameConfig.ts`): Beginner 3x3 with 3+3 items, Standard 4x4 with 5+5, Extreme 6x6 with
 * 7+7. Because the grid is generated per instance (any size), the cell sets are NOT hand-authored
 * here — `mod12SafeZone.ts` builds them at generation time and stores them in localVars.
 *
 * INVARIANT (enforced at generation, re-rolled on failure): for EVERY (threat_i, room_j) pair over
 * the active vocabulary, the intersection is EXACTLY ONE cell, and all pair answers are DISTINCT.
 * So the owner's named pair has a unique, unambiguous answer and no decoy pair collides.
 *
 * Vocabulary: the classic 3 threats/rooms stay first so Beginner keeps its original flavour.
 */

/** Threats the module can deal. Classic 3 first, then the extended set. */
export const THREATS: readonly Threat[] = ["Laser", "Plasma", "Kinetic", "Sonic", "EMP", "Acid", "Railgun"];

/** Room hazards the module can deal. Classic 3 first, then the extended set. */
export const ROOMS: readonly RoomHazard[] = [
  "Kitchen",
  "Armory",
  "Server",
  "Laboratory",
  "Reactor",
  "Hangar",
  "Vault",
];

/** Flavour label for each threat. */
export const THREAT_LABEL: Record<Threat, string> = {
  Laser: "Beams that sweep a band of the grid.",
  Plasma: "Superheated clouds that wash over a band.",
  Kinetic: "Flechettes that shred a band.",
  Sonic: "Standing waves that rattle a band.",
  EMP: "Pulses that fry a band.",
  Acid: "Splashes that eat through a band.",
  Railgun: "Slugs that punch through a band.",
};

/** Flavour label for each room hazard. */
export const HAZARD_LABEL: Record<RoomHazard, string> = {
  Kitchen: "Grease fires and steam.",
  Armory: "Ammunition cook-off.",
  Server: "Coolant and electrical arcs.",
  Laboratory: "Reagent spills and vacuum.",
  Reactor: "Radiation and heat bloom.",
  Hangar: "Fuel fires and shifting cargo.",
  Vault: "Collapsing racks and dust.",
};

export const mod12SafeZoneConfig: ModuleConfig<"MOD_12_SAFE_ZONE"> = {
  id: "MOD_12_SAFE_ZONE",
  name: "Safe Zone",
  kind: "Intersection Component",
  rules: {
    threats: THREATS,
    rooms: ROOMS,
    threatLabel: THREAT_LABEL,
    hazardLabel: HAZARD_LABEL,
    infoNotes: {
      info1: "Columns run left to right, rows run top to bottom.",
      info2: "A room is safe only where the owner's threat row AND the room row overlap.",
    },
  },
};
