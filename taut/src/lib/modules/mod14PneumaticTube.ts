import type { DocumentCode, TubeColor } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";

/** Info1_Baseline: which department owns each document. */
export const DEPARTMENT: Record<DocumentCode, "Legal" | "HR" | "Accounting"> = {
  "Doc-12": "Legal",
  "Doc-45": "HR",
  "Doc-77": "Accounting",
};

/** Info2_Modifier: which tube feeds each department. */
export const TUBE_MAP: Record<"Legal" | "HR" | "Accounting", TubeColor> = {
  HR: "Red",
  Legal: "Blue",
  Accounting: "Green",
};

export const TUBES: readonly TubeColor[] = ["Red", "Blue", "Green", "Yellow"];

export function correctTube(documentCode: DocumentCode): TubeColor {
  return TUBE_MAP[DEPARTMENT[documentCode]];
}

export const mod14PneumaticTube: ModuleDefinition<"MOD_14_PNEUMATIC_TUBE"> = {
  id: "MOD_14_PNEUMATIC_TUBE",
  name: "Pneumatic Tube",
  kind: "Routing Component",
  generate: (rng) => ({ documentCode: rng.pick(["Doc-12", "Doc-45", "Doc-77"] as const) }),
  info1: (vars) => [
    {
      title: "Document directory (Info 1)",
      columns: ["Document code", "Owning department"],
      rows: (["Doc-12", "Doc-45", "Doc-77"] as const).map((code) => ({
        cells: [code, DEPARTMENT[code]],
        highlight: code === vars.documentCode,
      })),
    },
  ],
  info2: (vars) => [
    {
      title: "Tube map (Info 2)",
      columns: ["Department", "Tube to use"],
      rows: (["HR", "Legal", "Accounting"] as const).map((dept) => ({
        cells: [dept, TUBE_MAP[dept]],
        highlight: TUBE_MAP[dept] === correctTube(vars.documentCode),
      })),
      note: "The YELLOW tube has no department label — never send a document through it.",
    },
  ],
  verify: (vars, answer) => answer.tube === correctTube(vars.documentCode),
  status: () => "Load the capsule into the tube you were told",
};
