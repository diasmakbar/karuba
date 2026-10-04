import type { HazardSymbol, ShapeId } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
import {
  ANTIDOTE,
  HAZARD_SYMBOLS,
  MIXTURES,
  SHAPES,
  VIAL_COLOR,
  mod05ChemistryConfig,
} from "./config/mod05Chemistry.config";

/** Info1_Baseline: antidote for each hazard. */
export { ANTIDOTE };
/** Info2_Modifier: what each vial actually contains. */
export { VIAL_COLOR };

export function mixtureLabel(hazard: HazardSymbol): string {
  const [a, b] = MIXTURES[ANTIDOTE[hazard]];
  return `${ANTIDOTE[hazard]} = ${a} + ${b}`;
}

export function pressedColors(buttons: readonly ShapeId[]): string[] {
  return buttons.map((shape) => VIAL_COLOR[shape]).filter((color) => color !== "Clear");
}

export const mod05Chemistry: ModuleDefinition<"MOD_05_CHEMISTRY"> = {
  config: mod05ChemistryConfig,
  id: mod05ChemistryConfig.id,
  name: mod05ChemistryConfig.name,
  kind: mod05ChemistryConfig.kind,
  generate: (rng) => ({ hazardSymbol: rng.pick(HAZARD_SYMBOLS) }),
  info1: (vars) => [
    {
      title: "Antidote chart (Info 1)",
      columns: ["Hazard symbol", "Required antidote"],
      rows: HAZARD_SYMBOLS.map((hazard) => ({
        cells: [hazard, ANTIDOTE[hazard]],
        highlight: hazard === vars.hazardSymbol,
      })),
      note: `The antidote must be mixed from two vials: ${mixtureLabel(vars.hazardSymbol)}.`,
    },
  ],
  info2: (vars) => {
    const wanted = MIXTURES[ANTIDOTE[vars.hazardSymbol]];
    return [
      {
        title: "Vial contents (Info 2)",
        columns: ["Shape on the button", "Liquid inside"],
        rows: SHAPES.map((shape) => ({
          cells: [shape, VIAL_COLOR[shape]],
          highlight: (wanted as readonly string[]).includes(VIAL_COLOR[shape]),
        })),
        note: "Two presses max. The Clear vial is a solvent — it adds nothing and will waste a slot.",
      },
    ];
  },
  verify: (vars, answer) => {
    if (answer.buttonsPressed.length === 0) return false;
    const expected = [...MIXTURES[ANTIDOTE[vars.hazardSymbol]]].sort();
    const actual = pressedColors(answer.buttonsPressed).sort();
    return actual.length === expected.length && actual.every((color, index) => color === expected[index]);
  },
  status: () => "Press two vials, then the module mixes automatically",
};
