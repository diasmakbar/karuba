import type { SynthTarget, VialId } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Bio-Synthesizer module (MOD_09).
 *
 * Culture requirements and inventory contents are data. The pools hold >= 10 of each; `generate`
 * picks a per-instance shortlist (5 for Beginner, 10 otherwise).
 *
 * IMPORTANT: every target's requirement triple must match EXACTLY ONE vial's contents, so the
 * answer is unambiguous. Requirements have three attributes (pH, temp, viscosity) giving 12
 * possible triples — more than the 10 targets/vials — and the tables below are a strict bijection.
 */

export interface Conditions {
  readonly ph: "Low" | "Neutral" | "High";
  readonly temp: "Low" | "High";
  readonly viscosity: "Thin" | "Thick";
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

/**
 * Info1_Baseline: what each culture type needs. Each triple is unique and matches exactly one
 * vial below (see VIAL_CONTENTS).
 */
export const REQUIREMENTS: Record<SynthTarget, Conditions> = {
  "Type A": { ph: "Low", temp: "High", viscosity: "Thin" },
  "Type B": { ph: "Neutral", temp: "Low", viscosity: "Thin" },
  "Type C": { ph: "High", temp: "Low", viscosity: "Thin" },
  "Type D": { ph: "Neutral", temp: "High", viscosity: "Thin" },
  "Type E": { ph: "Low", temp: "Low", viscosity: "Thin" },
  "Type F": { ph: "High", temp: "High", viscosity: "Thin" },
  "Type G": { ph: "Low", temp: "Low", viscosity: "Thick" },
  "Type H": { ph: "Neutral", temp: "High", viscosity: "Thick" },
  "Type I": { ph: "High", temp: "Low", viscosity: "Thick" },
  "Type J": { ph: "Low", temp: "High", viscosity: "Thick" },
};

/**
 * Info2_Modifier: what each inventory vial actually holds. The triples are a permutation of the
 * requirements so exactly one vial satisfies each target type.
 */
export const VIAL_CONTENTS: Record<VialId, Conditions> = {
  Alpha: { ph: "Low", temp: "Low", viscosity: "Thin" }, // Type E
  Beta: { ph: "Neutral", temp: "Low", viscosity: "Thin" }, // Type B
  Gamma: { ph: "High", temp: "Low", viscosity: "Thin" }, // Type C
  Delta: { ph: "High", temp: "High", viscosity: "Thin" }, // Type F
  Epsilon: { ph: "Neutral", temp: "High", viscosity: "Thin" }, // Type D
  Zeta: { ph: "Low", temp: "High", viscosity: "Thin" }, // Type A
  Eta: { ph: "Low", temp: "High", viscosity: "Thick" }, // Type J
  Theta: { ph: "High", temp: "Low", viscosity: "Thick" }, // Type I
  Iota: { ph: "Low", temp: "Low", viscosity: "Thick" }, // Type G
  Kappa: { ph: "Neutral", temp: "High", viscosity: "Thick" }, // Type H
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
      info2: "All three conditions must match exactly — read them out one at a time.",
    },
  },
};
