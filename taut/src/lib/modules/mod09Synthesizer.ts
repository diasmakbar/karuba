import type { SynthTarget, VialId } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
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

export function matchingVial(targetType: SynthTarget): VialId {
  const need = REQUIREMENTS[targetType];
  const match = VIAL_IDS.find(
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
  generate: (rng) => ({ targetType: rng.pick(TARGET_TYPES) }),
  info1: (vars) => [
    {
      title: "Culture requirements (Info 1)",
      columns: ["Target type", "Needs"],
      rows: TARGET_TYPES.map((type) => ({
        cells: [type, conditionLabel(REQUIREMENTS[type])],
        highlight: type === vars.targetType,
      })),
    },
  ],
  info2: (vars) => [
    {
      title: "Inventory contents (Info 2)",
      columns: ["Vial", "Contents"],
      rows: VIAL_IDS.map((vial) => ({
        cells: [vial, conditionLabel(VIAL_CONTENTS[vial])],
        highlight: vial === matchingVial(vars.targetType),
      })),
      note: "Both conditions must match exactly — read them out one at a time.",
    },
  ],
  verify: (vars, answer) => answer.vial === matchingVial(vars.targetType),
  status: () => "Press the vial you were told",
};
