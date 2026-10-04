import type { Destination, PersonName } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Biometric Scanner module (MOD_15).
 */

/** Destinations the module can deal (>= 10). */
export const DESTINATIONS: readonly Destination[] = [
  "Break Room",
  "Brake Room",
  "Wait Room",
  "Weight Room",
  "Sensor Lab",
  "Censor Lab",
  "Council Hall",
  "Counsel Hall",
  "Site A",
  "Sight A",
];

/** People in the security log (>= 10). */
export const PEOPLE: readonly PersonName[] = [
  "Rizki Pratama",
  "Rizky Pratama",
  "Chairul Anwar",
  "Khairul Anwar",
  "Syifa Aulia",
  "Sifa Aulia",
  "Fikri Saputra",
  "Vikri Saputra",
  "Naufal Hakim",
  "Noval Hakim",
];

/** Info1_Baseline: clearance each destination demands. */
export const CLEARANCE_REQUIRED: Record<Destination, number> = {
  "Break Room": 2,
  "Brake Room": 4,
  "Wait Room": 5,
  "Weight Room": 1,
  "Sensor Lab": 5,
  "Censor Lab": 4,
  "Council Hall": 5,
  "Counsel Hall": 2,
  "Site A": 5,
  "Sight A": 3,
};

/** Info2_Modifier: the badge level recorded in the security log. */
export const SECURITY_LOG: Record<PersonName, number> = {
  "Rizki Pratama": 5,
  "Rizky Pratama": 2,
  "Chairul Anwar": 4,
  "Khairul Anwar": 5,
  "Syifa Aulia": 3,
  "Sifa Aulia": 4,
  "Fikri Saputra": 1,
  "Vikri Saputra": 5,
  "Naufal Hakim": 2,
  "Noval Hakim": 4,
};

/** Destinations each person can legitimately reach — used to mix approvals and rejections. */
export const REACHABLE: Record<PersonName, readonly Destination[]> = {
  "Rizki Pratama": ["Break Room", "Brake Room", "Wait Room", "Sensor Lab", "Censor Lab", "Council Hall", "Site A"],
  "Rizky Pratama": ["Break Room", "Counsel Hall", "Weight Room"],
  "Chairul Anwar": ["Brake Room", "Censor Lab", "Sight A"],
  "Khairul Anwar": ["Wait Room", "Sensor Lab", "Council Hall", "Site A", "Sight A"],
  "Syifa Aulia": ["Break Room", "Brake Room", "Sight A"],
  "Sifa Aulia": ["Brake Room", "Censor Lab", "Sight A"],
  "Fikri Saputra": ["Break Room", "Counsel Hall", "Weight Room"],
  "Vikri Saputra": ["Wait Room", "Sensor Lab", "Council Hall", "Site A"],
  "Naufal Hakim": ["Break Room", "Counsel Hall"],
  "Noval Hakim": ["Brake Room", "Censor Lab", "Sight A"],
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