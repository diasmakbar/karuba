import type { FilterState, SorterColor, SorterObject, SorterShape } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";

/** Info1_Baseline: filter alpha rejects these colors. */
export function passesAlpha(color: SorterColor, filterAlpha: FilterState): boolean {
  return filterAlpha === "Active" ? color !== "Red" && color !== "Green" : color !== "Blue";
}

/** Info2_Modifier: filter beta keeps only this geometry. */
export function passesBeta(shape: SorterShape, filterBeta: FilterState): boolean {
  return filterBeta === "Active" ? shape === "Triangle" : shape === "Circle";
}

export function passesBoth(object: SorterObject, vars: { filterAlpha: FilterState; filterBeta: FilterState }): boolean {
  return passesAlpha(object.color, vars.filterAlpha) && passesBeta(object.shape, vars.filterBeta);
}

export function correctObjectIndex(vars: { filterAlpha: FilterState; filterBeta: FilterState; objects: SorterObject[] }): number {
  return vars.objects.findIndex((object) => passesBoth(object, vars));
}

export const ALPHA_RULE: Record<FilterState, string> = {
  Active: "Rejects RED and GREEN objects — anything else may pass.",
  Standby: "Rejects BLUE objects — anything else may pass.",
};

export const BETA_RULE: Record<FilterState, string> = {
  Active: "Requires exactly 3 sides — only a TRIANGLE passes.",
  Standby: "Requires 0 sharp corners — only a CIRCLE passes.",
};

export const mod13ShapeSorter: ModuleDefinition<"MOD_13_SHAPE_SORTER"> = {
  id: "MOD_13_SHAPE_SORTER",
  name: "Shape Sorter",
  kind: "Filtering Component",
  generate: (rng) => {
    const filterAlpha = rng.pick(["Active", "Standby"] as const);
    const filterBeta = rng.pick(["Active", "Standby"] as const);
    const survivorColor = filterAlpha === "Active" ? rng.pick(["Blue", "Yellow"] as const) : rng.pick(["Red", "Green", "Yellow"] as const);
    const survivorShape: SorterShape = filterBeta === "Active" ? "Triangle" : "Circle";
    const rejectedColor: SorterColor = filterAlpha === "Active" ? rng.pick(["Red", "Green"] as const) : "Blue";
    const rejectedShapes: SorterShape[] = filterBeta === "Active" ? ["Square", "Circle"] : ["Triangle", "Square"];
    return {
      filterAlpha,
      filterBeta,
      objects: rng.shuffle<SorterObject>([
        { color: survivorColor, shape: survivorShape },
        { color: rejectedColor, shape: survivorShape },
        { color: survivorColor, shape: rng.pick(rejectedShapes) },
        { color: rejectedColor, shape: rng.pick(rejectedShapes) },
      ]),
    };
  },
  info1: (vars) => [
    {
      title: "Filter ALPHA status (Info 1)",
      columns: ["Status", "Behaviour"],
      rows: (["Active", "Standby"] as const).map((state) => ({
        cells: [state, ALPHA_RULE[state]],
        highlight: state === vars.filterAlpha,
      })),
    },
  ],
  info2: (vars) => [
    {
      title: "Filter BETA status (Info 2)",
      columns: ["Status", "Behaviour"],
      rows: (["Active", "Standby"] as const).map((state) => ({
        cells: [state, BETA_RULE[state]],
        highlight: state === vars.filterBeta,
      })),
      note: "Exactly one of the four objects survives both filters — read out each object's color and shape and eliminate.",
    },
  ],
  verify: (vars, answer) => answer.objectIndex === correctObjectIndex(vars),
  status: () => "Tap the single object that passes both filters",
};
