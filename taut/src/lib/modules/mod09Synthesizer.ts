import type { SynthTarget, VialId } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";

type Conditions = { readonly ph: "Low" | "Neutral" | "High"; readonly temp: "Low" | "High" };

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

export function matchingVial(targetType: SynthTarget): VialId {
  const need = REQUIREMENTS[targetType];
  const match = (Object.keys(VIAL_CONTENTS) as VialId[]).find(
    (vial) => VIAL_CONTENTS[vial].ph === need.ph && VIAL_CONTENTS[vial].temp === need.temp,
  );
  return match ?? "Beta";
}

export function conditionLabel(conditions: Conditions): string {
  return `${conditions.ph} pH · ${conditions.temp} Temp`;
}

export const mod09Synthesizer: ModuleDefinition<"MOD_09_SYNTHESIZER"> = {
  id: "MOD_09_SYNTHESIZER",
  name: "Bio-Synthesizer",
  kind: "Mapping Component",
  generate: (rng) => ({ targetType: rng.pick(["Type A", "Type B", "Type C"] as const) }),
  info1: (vars) => [
    {
      title: "Culture requirements (Info 1)",
      columns: ["Target type", "Needs"],
      rows: (["Type A", "Type B", "Type C"] as const).map((type) => ({
        cells: [type, conditionLabel(REQUIREMENTS[type])],
        highlight: type === vars.targetType,
      })),
    },
  ],
  info2: (vars) => [
    {
      title: "Inventory contents (Info 2)",
      columns: ["Vial", "Contents"],
      rows: (["Alpha", "Beta", "Gamma", "Delta"] as const).map((vial) => ({
        cells: [vial, conditionLabel(VIAL_CONTENTS[vial])],
        highlight: vial === matchingVial(vars.targetType),
      })),
      note: "Both conditions must match exactly — read them out one at a time.",
    },
  ],
  verify: (vars, answer) => answer.vial === matchingVial(vars.targetType),
  status: () => "Press the vial you were told",
};
