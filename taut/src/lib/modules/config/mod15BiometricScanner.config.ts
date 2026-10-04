import type { Destination, PersonName } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Biometric Scanner module (MOD_15).
 *
 * Clearance requirements, badge levels and the reachability map are data. Rebalance who can go
 * where purely from this file.
 */

/** Destinations the module can deal. */
export const DESTINATIONS: readonly Destination[] = ["Maintenance", "Engineering", "Server Room"];

/** People in the security log. */
export const PEOPLE: readonly PersonName[] = ["Jane Smith", "John Doe", "Alan Turing"];

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

/** Destinations each person can legitimately reach — used to mix approvals and rejections. */
export const REACHABLE: Record<PersonName, readonly Destination[]> = {
  "Jane Smith": ["Maintenance", "Engineering", "Server Room"],
  "John Doe": ["Maintenance"],
  "Alan Turing": ["Engineering"],
};

/** Probability the host picks a reachable destination (else any destination). */
export const REACHABLE_CHANCE = 0.5;

export const mod15BiometricScannerConfig: ModuleConfig<"MOD_15_BIOMETRIC_SCANNER"> = {
  id: "MOD_15_BIOMETRIC_SCANNER",
  name: "Biometric Scanner",
  kind: "Logic Component",
  rules: {
    destinations: DESTINATIONS,
    people: PEOPLE,
    clearanceRequired: CLEARANCE_REQUIRED,
    securityLog: SECURITY_LOG,
    reachable: REACHABLE,
    reachableChance: REACHABLE_CHANCE,
    infoNotes: {
      info2: "APPROVE only if the badge level is greater than OR equal to the required clearance. Otherwise REJECT.",
    },
  },
};
