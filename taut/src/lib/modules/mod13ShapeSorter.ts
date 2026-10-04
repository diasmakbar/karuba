import type { FilterState, SorterColor, SorterObject, SorterShape } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
import {
  ALPHA_REJECTS,
  ALPHA_RULE,
  BETA_KEEPS,
  BETA_REJECTS,
  BETA_RULE,
  FILTER_STATES,
  mod13ShapeSorterConfig,
} from "./config/mod13ShapeSorter.config";

/** Info1_Baseline: filter alpha rejects these colors. */
export function passesAlpha(color: SorterColor, filterAlpha: FilterState): boolean {
  return !ALPHA_REJECTS[filterAlpha].includes(color);
}

/** Info2_Modifier: filter beta keeps only this geometry. */
export function passesBeta(shape: SorterShape, filterBeta: FilterState): boolean {
  return shape === BETA_KEEPS[filterBeta];
}

export function passesBoth(
  object: SorterObject,
  vars: { filterAlpha: FilterState; filterBeta: FilterState },
): boolean {
  return passesAlpha(object.color, vars.filterAlpha) && passesBeta(object.shape, vars.filterBeta);
}

export function correctObjectIndex(vars: {
  filterAlpha: FilterState;
  filterBeta: FilterState;
  objects: SorterObject[];
}): number {
  return vars.objects.findIndex((object) => passesBoth(object, vars));
}

export { ALPHA_RULE };
export { BETA_RULE };

export const mod13ShapeSorter: ModuleDefinition<"MOD_13_SHAPE_SORTER"> = {
  config: mod13ShapeSorterConfig,
  id: mod13ShapeSorterConfig.id,
  name: mod13ShapeSorterConfig.name,
  kind: mod13ShapeSorterConfig.kind,
  generate: (rng) => {
    const filterAlpha = rng.pick(FILTER_STATES);
    const filterBeta = rng.pick(FILTER_STATES);
    // Candidate colours/shapes for the surviving and rejected objects come from config sets.
    const survivorColor = rng.pick(rng.shuffle(["Blue", "Yellow"] as const));
    const survivorShape: SorterShape = BETA_KEEPS[filterBeta];
    const rejectedColor: SorterColor = rng.pick(ALPHA_REJECTS[filterAlpha]);
    const rejectedShapes: readonly SorterShape[] = BETA_REJECTS[filterBeta];
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
      rows: FILTER_STATES.map((state) => ({
        cells: [state, ALPHA_RULE[state]],
        highlight: state === vars.filterAlpha,
      })),
    },
  ],
  info2: (vars) => [
    {
      title: "Filter BETA status (Info 2)",
      columns: ["Status", "Behaviour"],
      rows: FILTER_STATES.map((state) => ({
        cells: [state, BETA_RULE[state]],
        highlight: state === vars.filterBeta,
      })),
      note: "Exactly one of the four objects survives both filters — read out each object's color and shape and eliminate.",
    },
  ],
  verify: (vars, answer) => answer.objectIndex === correctObjectIndex(vars),
  status: () => "Tap the single object that passes both filters",
};
