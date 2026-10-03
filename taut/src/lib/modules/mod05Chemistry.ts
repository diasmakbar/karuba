import type { HazardSymbol, ShapeId } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";

/** Info1_Baseline: antidote for each hazard. */
export const ANTIDOTE: Record<HazardSymbol, "ORANGE" | "GREEN" | "PURPLE"> = {
  Biohazard: "ORANGE",
  Radiation: "GREEN",
  Corrosive: "PURPLE",
};

/** Info2_Modifier: what each vial actually contains. */
export const VIAL_COLOR: Record<ShapeId, "Red" | "Yellow" | "Blue" | "Clear"> = {
  Triangle: "Red",
  Square: "Yellow",
  Hexagon: "Blue",
  Circle: "Clear",
};

/** Two-part mixes; "Clear" is the solvent and never contributes a hue. */
const MIXTURES: Record<"ORANGE" | "GREEN" | "PURPLE", ["Red" | "Yellow" | "Blue", "Red" | "Yellow" | "Blue"]> = {
  ORANGE: ["Red", "Yellow"],
  GREEN: ["Yellow", "Blue"],
  PURPLE: ["Red", "Blue"],
};

export function mixtureLabel(hazard: HazardSymbol): string {
  const [a, b] = MIXTURES[ANTIDOTE[hazard]];
  return `${ANTIDOTE[hazard]} = ${a} + ${b}`;
}

export function pressedColors(buttons: readonly ShapeId[]): string[] {
  return buttons.map((shape) => VIAL_COLOR[shape]).filter((color) => color !== "Clear");
}

export const mod05Chemistry: ModuleDefinition<"MOD_05_CHEMISTRY"> = {
  id: "MOD_05_CHEMISTRY",
  name: "Chemistry Lab",
  kind: "Association Component",
  generate: (rng) => ({ hazardSymbol: rng.pick(["Biohazard", "Radiation", "Corrosive"] as const) }),
  info1: (vars) => [
    {
      title: "Antidote chart (Info 1)",
      columns: ["Hazard symbol", "Required antidote"],
      rows: (["Biohazard", "Radiation", "Corrosive"] as const).map((hazard) => ({
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
        rows: (["Triangle", "Square", "Hexagon", "Circle"] as const).map((shape) => ({
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
