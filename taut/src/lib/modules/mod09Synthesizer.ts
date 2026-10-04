import type { SynthTarget, VialId } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
import { vocabSize } from "../gameConfig";
import {
  FALLBACK_VIAL,
  REQUIREMENTS,
  TARGET_TYPES,
  VIAL_CONTENTS,
  VIAL_IDS,
  mod09SynthesizerConfig,
  type Conditions,
} from "./config/mod09Synthesizer.config";

/** Info1_Baseline: what each culture type needs. */
export { REQUIREMENTS };
/** Info2_Modifier: what each inventory vial actually holds. */
export { VIAL_CONTENTS };

/**
 * The vial that satisfies the target. When a per-instance shortlist is supplied the search is
 * restricted to it (so the "correct" vial is always one the console actually shows); otherwise the
 * full inventory is searched. Falls back to the config fallback only when nothing matches.
 */
export function matchingVial(targetType: SynthTarget, vials: readonly VialId[] = VIAL_IDS): VialId {
  const need = REQUIREMENTS[targetType];
  const match = vials.find(
    (vial) => VIAL_CONTENTS[vial].ph === need.ph && VIAL_CONTENTS[vial].temp === need.temp,
  );
  return match ?? FALLBACK_VIAL;
}

export function conditionLabel(conditions: Conditions): string {
  return `${conditions.ph} pH · ${conditions.temp} Temp`;
}

export const mod09Synthesizer: ModuleDefinition<"MOD_09_SYNTHESIZER"> = {
  config: mod09SynthesizerConfig,
  id: mod09SynthesizerConfig.id,
  name: mod09SynthesizerConfig.name,
  kind: mod09SynthesizerConfig.kind,
  generate: (rng, difficulty) => {
    const n = vocabSize(difficulty);
    const targetType = rng.pick(TARGET_TYPES);
    const match = matchingVial(targetType, VIAL_IDS);
    // Deal `n` target types (the correct one included) and `n` vials (the matching one included).
    const otherTargets = rng.shuffle(TARGET_TYPES.filter((type) => type !== targetType) as SynthTarget[]);
    const otherVials = rng.shuffle(VIAL_IDS.filter((vial) => vial !== match) as VialId[]);
    const targetTypes = rng.shuffle<SynthTarget>([targetType, ...otherTargets.slice(0, n - 1)]);
    const vialIds = rng.shuffle<VialId>([match, ...otherVials.slice(0, n - 1)]);
    return { targetType, targetTypes, vialIds };
  },
  info1: (vars) => [
    {
      title: "Culture requirements (Info 1)",
      columns: ["Target type", "Needs"],
      rows: (Array.isArray(vars.targetTypes) ? vars.targetTypes : TARGET_TYPES).map((type) => ({
        cells: [type, conditionLabel(REQUIREMENTS[type])],
        highlight: type === vars.targetType,
      })),
    },
  ],
  info2: (vars) => [
    {
      title: "Inventory contents (Info 2)",
      columns: ["Vial", "Contents"],
      rows: (Array.isArray(vars.vialIds) ? vars.vialIds : VIAL_IDS).map((vial) => ({
        cells: [vial, conditionLabel(VIAL_CONTENTS[vial])],
        highlight: vial === matchingVial(vars.targetType, vars.vialIds),
      })),
      note: "Both conditions must match exactly — read them out one at a time.",
    },
  ],
  verify: (vars, answer) => answer.vial === matchingVial(vars.targetType, vars.vialIds),
  status: () => "Press the vial you were told",
};
