import type { DocumentCode, TubeColor } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
import {
  DEPARTMENTS,
  DEPARTMENT,
  DOCUMENTS,
  TUBE_MAP,
  TUBES,
  mod14PneumaticTubeConfig,
  type Department,
} from "./config/mod14PneumaticTube.config";

/** Info1_Baseline: which department owns each document. */
export { DEPARTMENT };
/** Info2_Modifier: which tube feeds each department. */
export { TUBE_MAP };
export { TUBES };

export function correctTube(documentCode: DocumentCode): TubeColor {
  return TUBE_MAP[DEPARTMENT[documentCode]];
}

export const mod14PneumaticTube: ModuleDefinition<"MOD_14_PNEUMATIC_TUBE"> = {
  config: mod14PneumaticTubeConfig,
  id: mod14PneumaticTubeConfig.id,
  name: mod14PneumaticTubeConfig.name,
  kind: mod14PneumaticTubeConfig.kind,
  generate: (rng) => ({ documentCode: rng.pick(DOCUMENTS) }),
  info1: (vars) => [
    {
      title: "Document directory (Info 1)",
      columns: ["Document code", "Owning department"],
      rows: DOCUMENTS.map((code) => ({
        cells: [code, DEPARTMENT[code]],
        highlight: code === vars.documentCode,
      })),
    },
  ],
  info2: (vars) => [
    {
      title: "Tube map (Info 2)",
      columns: ["Department", "Tube to use"],
      rows: DEPARTMENTS.map((dept: Department) => ({
        cells: [dept, TUBE_MAP[dept]],
        highlight: TUBE_MAP[dept] === correctTube(vars.documentCode),
      })),
      note: "The YELLOW tube has no department label — never send a document through it.",
    },
  ],
  verify: (vars, answer) => answer.tube === correctTube(vars.documentCode),
  status: () => "Load the capsule into the tube you were told",
};
