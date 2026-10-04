import type { Destination, PersonName } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Biometric Scanner module (MOD_15).
 *
 * Clearance requirements, badge levels and the reachability map are data. Rebalance who can go
 * where purely from this file. The pools hold >= 10 destinations and people; `generate` picks a
 * per-instance shortlist (5 for Beginner, 10 otherwise).
 */

/** Destinations the module can deal (>= 10). */
export const DESTINATIONS: readonly Destination[] = [
  "Maintenance",
  "Engineering",
  "Server Room",
  "Archives",
  "Observatory",
  "Lab",
  "Reactor",
  "Hangar",
  "Vault",
  "Bridge",
];

/** People in the security log (>= 10). */
export const PEOPLE: readonly PersonName[] = [
  "Jane Smith",
  "John Doe",
  "Alan Turing",
  "Grace Hopper",
  "Ada Lovelace",
  "Katherine J.",
  "Linus T.",
  "Margaret H.",
  "Dennis R.",
  "Barbara L.",
];

/** Info1_Baseline: clearance each destination demands. */
export const CLEARANCE_REQUIRED: Record<Destination, number> = {
  Maintenance: 2,
  Engineering: 4,
  "Server Room": 5,
  Archives: 1,
  Observatory: 5,
  Lab: 4,
  Reactor: 5,
  Hangar: 2,
  Vault: 5,
  Bridge: 3,
};

/** Info2_Modifier: the badge level recorded in the security log. */
export const SECURITY_LOG: Record<PersonName, number> = {
  "Jane Smith": 5,
  "John Doe": 2,
  "Alan Turing": 4,
  "Grace Hopper": 5,
  "Ada Lovelace": 3,
  "Katherine J.": 4,
  "Linus T.": 1,
  "Margaret H.": 5,
  "Dennis R.": 2,
  "Barbara L.": 4,
};

/** Destinations each person can legitimately reach — used to mix approvals and rejections. */
export const REACHABLE: Record<PersonName, readonly Destination[]> = {
  "Jane Smith": ["Maintenance", "Engineering", "Server Room", "Observatory", "Lab", "Reactor", "Vault"],
  "John Doe": ["Maintenance", "Hangar", "Archives"],
  "Alan Turing": ["Engineering", "Lab", "Bridge"],
  "Grace Hopper": ["Server Room", "Observatory", "Reactor", "Vault", "Bridge"],
  "Ada Lovelace": ["Maintenance", "Engineering", "Bridge"],
  "Katherine J.": ["Engineering", "Lab", "Bridge"],
  "Linus T.": ["Maintenance", "Hangar", "Archives"],
  "Margaret H.": ["Server Room", "Observatory", "Reactor", "Vault"],
  "Dennis R.": ["Maintenance", "Hangar"],
  "Barbara L.": ["Engineering", "Lab", "Bridge"],
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
