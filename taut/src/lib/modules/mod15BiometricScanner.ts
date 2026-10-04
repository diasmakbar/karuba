import type { Destination, PersonName } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
import { vocabSize } from "../gameConfig";
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
  generate: (rng, difficulty) => {
    const n = vocabSize(difficulty);
    const personName = rng.pick(PEOPLE);
    const destination = rng.bool() && REACHABLE[personName].length > 0
      ? rng.pick(REACHABLE[personName])
      : rng.pick(DESTINATIONS);
    void REACHABLE_CHANCE;
    // Deal `n` destinations (the target among them) and `n` people (the scanned one among them).
    const otherDestinations = rng.shuffle(
      DESTINATIONS.filter((item) => item !== destination) as Destination[],
    );
    const destinations = rng.shuffle<Destination>([destination, ...otherDestinations.slice(0, n - 1)]);
    const otherPeople = rng.shuffle(PEOPLE.filter((item) => item !== personName) as PersonName[]);
    const people = rng.shuffle<PersonName>([personName, ...otherPeople.slice(0, n - 1)]);
    return { personName, destination, people, destinations };
  },
  info1: (vars) => [
    {
      title: "Clearance required (Info 1)",
      columns: ["Destination", "Clearance level"],
      rows: (Array.isArray(vars.destinations) ? vars.destinations : DESTINATIONS).map((destination) => ({
        cells: [destination, `Level ${CLEARANCE_REQUIRED[destination]}`],
        highlight: destination === vars.destination,
      })),
    },
  ],
  info2: (vars) => [
    {
      title: "Security log — badge levels (Info 2)",
      columns: ["Person", "Badge level"],
      rows: (Array.isArray(vars.people) ? vars.people : PEOPLE).map((person) => ({
        cells: [person, `Level ${SECURITY_LOG[person]}`],
        highlight: person === vars.personName,
      })),
      note: "APPROVE only if the badge level is greater than OR equal to the required clearance. Otherwise REJECT.",
    },
  ],
  verify: (vars, answer) => answer.action === correctDecision(vars),
  status: () => "Approve or reject based on the two clearance numbers read to you",
};
