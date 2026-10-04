import type { DocumentCode, TubeColor } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Pneumatic Tube module (MOD_14).
 *
 * Document→department and department→tube mappings are data. Add a document or rewire a tube
 * here only. The document pool holds >= 10; `generate` picks a per-instance shortlist (5 for
 * Beginner, 10 otherwise).
 */

export type Department =
  | "Legal"
  | "HR"
  | "Accounting"
  | "IT"
  | "Security"
  | "Research"
  | "Logistics"
  | "Media"
  | "Facilities"
  | "Archives";

/** Document codes the module can deal (>= 10). */
export const DOCUMENTS: readonly DocumentCode[] = [
  "Doc-12",
  "Doc-45",
  "Doc-77",
  "Doc-03",
  "Doc-28",
  "Doc-51",
  "Doc-64",
  "Doc-89",
  "Doc-90",
  "Doc-33",
];

/** Departments documents route to. */
export const DEPARTMENTS: readonly Department[] = [
  "HR",
  "Legal",
  "Accounting",
  "IT",
  "Security",
  "Research",
  "Logistics",
  "Media",
  "Facilities",
  "Archives",
];

/** Tubes available on the panel; Yellow is an unlabelled decoy. */
export const TUBES: readonly TubeColor[] = ["Red", "Blue", "Green", "Yellow"];

/** Info1_Baseline: which department owns each document. */
export const DEPARTMENT: Record<DocumentCode, Department> = {
  "Doc-12": "Legal",
  "Doc-45": "HR",
  "Doc-77": "Accounting",
  "Doc-03": "IT",
  "Doc-28": "Security",
  "Doc-51": "Research",
  "Doc-64": "Logistics",
  "Doc-89": "Media",
  "Doc-90": "Facilities",
  "Doc-33": "Archives",
};

/** Info2_Modifier: which tube feeds each department. */
export const TUBE_MAP: Record<Department, TubeColor> = {
  HR: "Red",
  Legal: "Blue",
  Accounting: "Green",
  IT: "Blue",
  Security: "Green",
  Research: "Red",
  Logistics: "Blue",
  Media: "Green",
  Facilities: "Red",
  Archives: "Blue",
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
