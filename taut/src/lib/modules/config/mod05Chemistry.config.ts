import type { HazardSymbol, ShapeId } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Chemistry Lab module (MOD_05).
 *
 * Antidote chart, vial contents and mixture recipes are all data. Add a hazard, a vials
 * shape or a mix here and the implementation picks it up automatically.
 */

export type ChemistryColor = "ORANGE" | "GREEN" | "PURPLE";
/** Actual liquid colours; "Clear" is the solvent. */
export type LiquidColor = "Red" | "Yellow" | "Blue" | "Clear";

/** Hazard symbols the module can deal. */
export const HAZARD_SYMBOLS: readonly HazardSymbol[] = ["Biohazard", "Radiation", "Corrosive"];

/** Button shapes (vials). */
export const SHAPES: readonly ShapeId[] = ["Triangle", "Square", "Hexagon", "Circle"];

/** Info1_Baseline: antidote for each hazard. */
export const ANTIDOTE: Record<HazardSymbol, ChemistryColor> = {
  Biohazard: "ORANGE",
  Radiation: "GREEN",
  Corrosive: "PURPLE",
};

/** Info2_Modifier: what each vial actually contains. */
export const VIAL_COLOR: Record<ShapeId, LiquidColor> = {
  Triangle: "Red",
  Square: "Yellow",
  Hexagon: "Blue",
  Circle: "Clear",
};

/** Two-part mixes; "Clear" is the solvent and never contributes a hue. */
export const MIXTURES: Record<ChemistryColor, readonly [LiquidColor, LiquidColor]> = {
  ORANGE: ["Red", "Yellow"],
  GREEN: ["Yellow", "Blue"],
  PURPLE: ["Red", "Blue"],
};

export const mod05ChemistryConfig: ModuleConfig<"MOD_05_CHEMISTRY"> = {
  id: "MOD_05_CHEMISTRY",
  name: "Chemistry Lab",
  kind: "Association Component",
  rules: {
    hazards: HAZARD_SYMBOLS,
    shapes: SHAPES,
    antidote: ANTIDOTE,
    vialColor: VIAL_COLOR,
    mixtures: MIXTURES,
    infoNotes: {
      info2:
        "Two presses max. The Clear vial is a solvent — it adds nothing and will waste a slot.",
    },
  },
};
