import type { SynthTarget, VialId } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Bio-Synthesizer module (MOD_09).
 *
 * Culture requirements and inventory contents are data. Add a target type or a vial here and
 * the matching logic adapts without code changes.
 */

export interface Conditions {
  readonly ph: "Low" | "Neutral" | "High";
  readonly temp: "Low" | "High";
}

/** Target types the module can deal. */
export const TARGET_TYPES: readonly SynthTarget[] = ["Type A", "Type B", "Type C"];

/** Vials in the inventory. */
export const VIAL_IDS: readonly VialId[] = ["Alpha", "Beta", "Gamma", "Delta"];

/** Info1_Baseline: what each culture type needs. */
export const REQUIREMENTS: Record<SynthTarget, Conditions> = {
  "Type A": { ph: "Low", temp: "High" },
  "Type B": { ph: "Neutral", temp: "Low" },
  "Type C": { ph: "High", temp: "Low" },
};

/** Info2_Modifier: what each inventory vial actually holds. */
export const VIAL_CONTENTS: Record<VialId, Conditions> = {
  Alpha: { ph: "High", temp: "High" },
  Beta: { ph: "Low", temp: "Low" },
  Gamma: { ph: "High", temp: "Low" },
  Delta: { ph: "Low", temp: "High" },
};

/** Fallback vial if no exact match exists. */
export const FALLBACK_VIAL: VialId = "Beta";

export const mod09SynthesizerConfig: ModuleConfig<"MOD_09_SYNTHESIZER"> = {
  id: "MOD_09_SYNTHESIZER",
  name: "Bio-Synthesizer",
  kind: "Mapping Component",
  rules: {
    targetTypes: TARGET_TYPES,
    vialIds: VIAL_IDS,
    requirements: REQUIREMENTS,
    vialContents: VIAL_CONTENTS,
    fallbackVial: FALLBACK_VIAL,
    infoNotes: {
      info2: "Both conditions must match exactly — read them out one at a time.",
    },
  },
};
