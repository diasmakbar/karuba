import type { Destination, PersonName } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
import {
  CLEARANCE_REQUIRED,
  DESTINATIONS,
  PEOPLE,
  REACHABLE,
  REACHABLE_CHANCE,
  SECURITY_LOG,
  mod15BiometricScannerConfig,
} from "./config/mod15BiometricScanner.config";

export type BiometricDecision = "APPROVE" | "REJECT";

/** Info1_Baseline: clearance each destination demands. */
export { CLEARANCE_REQUIRED };
/** Info2_Modifier: the badge level recorded in the security log. */
export { SECURITY_LOG };

/** APPROVE only when the logged badge level meets or exceeds the requirement. */
export function correctDecision(vars: { personName: PersonName; destination: Destination }): BiometricDecision {
  return SECURITY_LOG[vars.personName] >= CLEARANCE_REQUIRED[vars.destination] ? "APPROVE" : "REJECT";
}

export const mod15BiometricScanner: ModuleDefinition<"MOD_15_BIOMETRIC_SCANNER"> = {
  config: mod15BiometricScannerConfig,
  id: mod15BiometricScannerConfig.id,
  name: mod15BiometricScannerConfig.name,
  kind: mod15BiometricScannerConfig.kind,
  generate: (rng) => {
    const personName = rng.pick(PEOPLE);
    const destination = rng.bool() && REACHABLE[personName].length > 0
      ? rng.pick(REACHABLE[personName])
      : rng.pick(DESTINATIONS);
    void REACHABLE_CHANCE;
    return { personName, destination };
  },
  info1: (vars) => [
    {
      title: "Clearance required (Info 1)",
      columns: ["Destination", "Clearance level"],
      rows: DESTINATIONS.map((destination) => ({
        cells: [destination, `Level ${CLEARANCE_REQUIRED[destination]}`],
        highlight: destination === vars.destination,
      })),
    },
  ],
  info2: (vars) => [
    {
      title: "Security log — badge levels (Info 2)",
      columns: ["Person", "Badge level"],
      rows: PEOPLE.map((person) => ({
        cells: [person, `Level ${SECURITY_LOG[person]}`],
        highlight: person === vars.personName,
      })),
      note: "APPROVE only if the badge level is greater than OR equal to the required clearance. Otherwise REJECT.",
    },
  ],
  verify: (vars, answer) => answer.action === correctDecision(vars),
  status: () => "Approve or reject based on the two clearance numbers read to you",
};
