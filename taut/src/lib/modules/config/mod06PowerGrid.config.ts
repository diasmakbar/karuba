import type { Switches, WarningLight } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Power Grid module (MOD_06).
 *
 * The baseline switch patterns, the inversion protocol per warning light and the switch
 * count are all data. Change the required pattern or which positions invert here only.
 */

/** Number of switches on the panel. */
export const SWITCH_COUNT = 5;

export const ALL_OFF: Switches = Array.from({ length: SWITCH_COUNT }, () => false) as unknown as Switches;

/** Warning lights the module can show. */
export const WARNING_LIGHTS: readonly WarningLight[] = ["FLASHING", "SOLID"];

/** Info1_Baseline: the required switch pattern keyed by serial parity. */
export const SWITCH_BASELINE: Record<"even" | "odd", Switches> = {
  even: [true, false, true, false, false],
  odd: [false, true, false, true, true],
};

/** Info2_Modifier: which 0-based positions each warning light inverts. */
export const INVERT_POSITIONS: Record<WarningLight, readonly number[]> = {
  FLASHING: [1, 3],
  SOLID: [0, 4],
};

/** Human-readable inversion labels (1-based switch numbers). */
export const INVERT_LABEL: Record<WarningLight, string> = {
  FLASHING: "Switch 2 and Switch 4",
  SOLID: "Switch 1 and Switch 5",
};

export const mod06PowerGridConfig: ModuleConfig<"MOD_06_POWER_GRID"> = {
  id: "MOD_06_POWER_GRID",
  name: "Power Grid",
  kind: "Puzzle Component",
  rules: {
    switchCount: SWITCH_COUNT,
    warningLights: WARNING_LIGHTS,
    switchBaseline: SWITCH_BASELINE,
    invertPositions: INVERT_POSITIONS,
    invertLabel: INVERT_LABEL,
    infoNotes: {
      info1: "Switch 1 is the leftmost. Read all five states out loud.",
      info2: "Invert means flip that switch to the opposite side of the Info 1 pattern, then the owner executes.",
    },
  },
};
