import type { SynthTarget, VialId } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Bio-Synthesizer module (MOD_09).
 *
 * Culture requirements and inventory contents are data. Add a target type or a vial here and
 * the matching logic adapts without code changes. The pools hold >= 10 of each; `generate` picks a
 * per-instance shortlist (5 for Beginner, 10 otherwise) where exactly one vial matches the target.
 */

export interface Conditions {
  readonly ph: "Low" | "Neutral" | "High";
  readonly temp: "Low" | "High";
}

/** Target types the module can deal (>= 10). */
export const TARGET_TYPES: readonly SynthTarget[] = [
  "Type A",
  "Type B",
  "Type C",
  "Type D",
  "Type E",
  "Type F",
  "Type G",
  "Type H",
  "Type I",
  "Type J",
];

/** Vials in the inventory (>= 10). */
export const VIAL_IDS: readonly VialId[] = [
  "Alpha",
  "Beta",
  "Gamma",
  "Delta",
  "Epsilon",
  "Zeta",
  "Eta",
  "Theta",
  "Iota",
  "Kappa",
];

/** Info1_Baseline: what each culture type needs. */
export const REQUIREMENTS: Record<SynthTarget, Conditions> = {
  "Type A": { ph: "Low", temp: "High" },
  "Type B": { ph: "Neutral", temp: "Low" },
  "Type C": { ph: "High", temp: "Low" },
  "Type D": { ph: "Neutral", temp: "High" },
  "Type E": { ph: "Low", temp: "Low" },
  "Type F": { ph: "High", temp: "High" },
  "Type G": { ph: "Low", temp: "Low" },
  "Type H": { ph: "Neutral", temp: "High" },
  "Type I": { ph: "High", temp: "Low" },
  "Type J": { ph: "Low", temp: "High" },
};

/**
 * Info2_Modifier: what each inventory vial actually holds. Arranged so every target type has a
 * distinct matching vial (identical requirement pairs are still matched by distinct vials below).
 */
export const VIAL_CONTENTS: Record<VialId, Conditions> = {
  Alpha: { ph: "High", temp: "High" },
  Beta: { ph: "Low", temp: "Low" },
  Gamma: { ph: "High", temp: "Low" },
  Delta: { ph: "Low", temp: "High" },
  Epsilon: { ph: "Neutral", temp: "High" },
  Zeta: { ph: "Neutral", temp: "Low" },
  Eta: { ph: "Low", temp: "High" },
  Theta: { ph: "High", temp: "Low" },
  Iota: { ph: "Low", temp: "Low" },
  Kappa: { ph: "High", temp: "High" },
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
