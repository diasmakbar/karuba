import type { SorterColor, SorterShape } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Shape Sorter module (MOD_13).
 *
 * Filter behaviours, accepted/rejected value sets and the object pool sizes are data. All the
 * pass/fail logic reads from this file so the filtering rules can be re-tuned without code edits.
 */

export type FilterState = "Active" | "Standby";

/** Filter states. */
export const FILTER_STATES: readonly FilterState[] = ["Active", "Standby"];

/** Colours an object can have. */
export const SORTER_COLORS: readonly SorterColor[] = ["Red", "Green", "Blue", "Yellow"];

/** Shapes an object can have. */
export const SORTER_SHAPES: readonly SorterShape[] = ["Triangle", "Square", "Circle"];

/** Info1_Baseline: colours filter alpha REJECTS for each state. */
export const ALPHA_REJECTS: Record<FilterState, readonly SorterColor[]> = {
  Active: ["Red", "Green"],
  Standby: ["Blue"],
};

/** Info2_Modifier: the single shape filter beta ACCEPTS for each state. */
export const BETA_KEEPS: Record<FilterState, SorterShape> = {
  Active: "Triangle",
  Standby: "Circle",
};

export const ALPHA_RULE: Record<FilterState, string> = {
  Active: "Rejects RED and GREEN objects — anything else may pass.",
  Standby: "Rejects BLUE objects — anything else may pass.",
};

export const BETA_RULE: Record<FilterState, string> = {
  Active: "Requires exactly 3 sides — only a TRIANGLE passes.",
  Standby: "Requires 0 sharp corners — only a CIRCLE passes.",
};

/** Shapes that fail each filter-beta state (used to build the object pool). */
export const BETA_REJECTS: Record<FilterState, readonly SorterShape[]> = {
  Active: ["Square", "Circle"],
  Standby: ["Triangle", "Square"],
};

export const mod13ShapeSorterConfig: ModuleConfig<"MOD_13_SHAPE_SORTER"> = {
  id: "MOD_13_SHAPE_SORTER",
  name: "Shape Sorter",
  kind: "Filtering Component",
  rules: {
    filterStates: FILTER_STATES,
    colors: SORTER_COLORS,
    shapes: SORTER_SHAPES,
    alphaRejects: ALPHA_REJECTS,
    betaKeeps: BETA_KEEPS,
    betaRejects: BETA_REJECTS,
    alphaRule: ALPHA_RULE,
    betaRule: BETA_RULE,
    infoNotes: {
      info2: "Exactly one of the dealt objects survives both filters — read out each object's color and shape and eliminate.",
    },
  },
};
