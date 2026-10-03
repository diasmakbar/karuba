import type { Destination, PersonName } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";

/** Info1_Baseline: clearance each destination demands. */
export const CLEARANCE_REQUIRED: Record<Destination, number> = {
  Maintenance: 2,
  Engineering: 4,
  "Server Room": 5,
};

/** Info2_Modifier: the badge level recorded in the security log. */
export const SECURITY_LOG: Record<PersonName, number> = {
  "Jane Smith": 5,
  "John Doe": 2,
  "Alan Turing": 4,
};

export type BiometricDecision = "APPROVE" | "REJECT";

/** APPROVE only when the logged badge level meets or exceeds the requirement. */
export function correctDecision(vars: { personName: PersonName; destination: Destination }): BiometricDecision {
  return SECURITY_LOG[vars.personName] >= CLEARANCE_REQUIRED[vars.destination] ? "APPROVE" : "REJECT";
}

/** Destinations each person can legitimately reach — used to mix approvals and rejections. */
const REACHABLE: Record<PersonName, Destination[]> = {
  "Jane Smith": ["Maintenance", "Engineering", "Server Room"],
  "John Doe": ["Maintenance"],
  "Alan Turing": ["Engineering"],
};

const ALL_DESTINATIONS: Destination[] = ["Maintenance", "Engineering", "Server Room"];

export const mod15BiometricScanner: ModuleDefinition<"MOD_15_BIOMETRIC_SCANNER"> = {
  id: "MOD_15_BIOMETRIC_SCANNER",
  name: "Biometric Scanner",
  kind: "Logic Component",
  generate: (rng) => {
    const personName = rng.pick(["Jane Smith", "John Doe", "Alan Turing"] as const);
    const destination = rng.bool() ? rng.pick(REACHABLE[personName]) : rng.pick(ALL_DESTINATIONS);
    return { personName, destination };
  },
  info1: (vars) => [
    {
      title: "Clearance required (Info 1)",
      columns: ["Destination", "Clearance level"],
      rows: (["Maintenance", "Engineering", "Server Room"] as const).map((destination) => ({
        cells: [destination, `Level ${CLEARANCE_REQUIRED[destination]}`],
        highlight: destination === vars.destination,
      })),
    },
  ],
  info2: (vars) => [
    {
      title: "Security log — badge levels (Info 2)",
      columns: ["Person", "Badge level"],
      rows: (["Jane Smith", "John Doe", "Alan Turing"] as const).map((person) => ({
        cells: [person, `Level ${SECURITY_LOG[person]}`],
        highlight: person === vars.personName,
      })),
      note: "APPROVE only if the badge level is greater than OR equal to the required clearance. Otherwise REJECT.",
    },
  ],
  verify: (vars, answer) => answer.action === correctDecision(vars),
  status: () => "Approve or reject based on the two clearance numbers read to you",
};
