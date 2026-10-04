import type { DocumentCode, TubeColor } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Pneumatic Tube module (MOD_14).
 *
 * Document→department and department→tube mappings are data. Add a document or rewire a tube
 * here only.
 */

export type Department = "Legal" | "HR" | "Accounting";

/** Document codes the module can deal. */
export const DOCUMENTS: readonly DocumentCode[] = ["Doc-12", "Doc-45", "Doc-77"];

/** Departments documents route to. */
export const DEPARTMENTS: readonly Department[] = ["HR", "Legal", "Accounting"];

/** Tubes available on the panel; Yellow is an unlabelled decoy. */
export const TUBES: readonly TubeColor[] = ["Red", "Blue", "Green", "Yellow"];

/** Info1_Baseline: which department owns each document. */
export const DEPARTMENT: Record<DocumentCode, Department> = {
  "Doc-12": "Legal",
  "Doc-45": "HR",
  "Doc-77": "Accounting",
};

/** Info2_Modifier: which tube feeds each department. */
export const TUBE_MAP: Record<Department, TubeColor> = {
  HR: "Red",
  Legal: "Blue",
  Accounting: "Green",
};

export const mod14PneumaticTubeConfig: ModuleConfig<"MOD_14_PNEUMATIC_TUBE"> = {
  id: "MOD_14_PNEUMATIC_TUBE",
  name: "Pneumatic Tube",
  kind: "Routing Component",
  rules: {
    documents: DOCUMENTS,
    departments: DEPARTMENTS,
    tubes: TUBES,
    department: DEPARTMENT,
    tubeMap: TUBE_MAP,
    infoNotes: {
      info2: "The YELLOW tube has no department label — never send a document through it.",
    },
  },
};
