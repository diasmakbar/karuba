import type { DocumentCode, TubeColor } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
import { vocabSize } from "../gameConfig";
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
  generate: (rng, difficulty) => {
    const n = vocabSize(difficulty);
    const documentCode = rng.pick(DOCUMENTS);
    // Deal `n` documents (the owner's among them).
    const otherDocs = rng.shuffle(
      DOCUMENTS.filter((code) => code !== documentCode) as DocumentCode[],
    );
    const documents = rng.shuffle<DocumentCode>([documentCode, ...otherDocs.slice(0, n - 1)]);
    return { documentCode, documents };
  },
  info1: (vars) => [
    {
      title: "Document directory (Info 1)",
      columns: ["Document code", "Owning department"],
      rows: (Array.isArray(vars.documents) ? vars.documents : DOCUMENTS).map((code) => ({
        cells: [code, DEPARTMENT[code]],
        highlight: code === vars.documentCode,
      })),
    },
  ],
  info2: (vars) => {
    // Only show the tubes feeding the departments relevant to the dealt documents.
    const docs = Array.isArray(vars.documents) ? vars.documents : DOCUMENTS;
    const relevant = Array.from(new Set(docs.map((code) => DEPARTMENT[code])));
    const depts = DEPARTMENTS.filter((dept) => relevant.includes(dept));
    return [
      {
        title: "Tube map (Info 2)",
        columns: ["Department", "Tube to use"],
        rows: depts.map((dept: Department) => ({
          cells: [dept, TUBE_MAP[dept]],
          highlight: TUBE_MAP[dept] === correctTube(vars.documentCode),
        })),
        note: "The YELLOW tube has no department label — never send a document through it.",
      },
    ];
  },
  verify: (vars, answer) => answer.tube === correctTube(vars.documentCode),
  status: () => "Load the capsule into the tube you were told",
};
