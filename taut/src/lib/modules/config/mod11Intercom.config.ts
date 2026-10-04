import type { IntercomMessage, IntercomResponse } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Intercom module (MOD_11).
 *
 * The transmission dictionary and reply protocol are data. Swap the words, meanings or replies
 * from this file without touching `mod11Intercom.ts`. The pools hold >= 10 messages and replies;
 * `generate` picks a per-instance shortlist (5 for Beginner, 10 otherwise).
 */

/** Incoming transmissions the module can deal (>= 10). */
export const MESSAGES: readonly IntercomMessage[] = [
  "KLAATU",
  "GORT",
  "VERATA",
  "SLEESTAK",
  "MOGAR",
  "ZOLTAN",
  "TRON",
  "VINZCLAV",
  "GOZER",
  "KEYMASTER",
];

/** Info1_Baseline: dictionary of the incoming transmissions (one distinct meaning each). */
export const DICTIONARY: Record<IntercomMessage, string> = {
  KLAATU: "Requesting Status",
  GORT: "Hostile Presence",
  VERATA: "Requesting Supply Drop",
  SLEESTAK: "Perimeter Breach",
  MOGAR: "Requesting Backup",
  ZOLTAN: "Systems Nominal",
  TRON: "Entering The Grid",
  VINZCLAV: "Awaiting Orders",
  GOZER: "Containment Failure",
  KEYMASTER: "Access Granted",
};

/** Info2_Modifier: the required reply for each meaning. */
export const PROTOCOL: Record<string, IntercomResponse> = {
  "Requesting Status": "NIKTO",
  "Hostile Presence": "BARADA",
  "Requesting Supply Drop": "SHREK",
  "Perimeter Breach": "SURRENDER",
  "Requesting Backup": "PROCEED",
  "Systems Nominal": "CONFIRM",
  "Entering The Grid": "DAGOTH",
  "Awaiting Orders": "ABORT",
  "Containment Failure": "ANNIHILATE",
  "Access Granted": "SURRENDER",
};

/** Candidate replies on the console (>= 10); the ones not in the protocol are decoys. */
export const RESPONSES: readonly IntercomResponse[] = [
  "BARADA",
  "NIKTO",
  "SHREK",
  "FIONA",
  "DAGOTH",
  "ANNIHILATE",
  "SURRENDER",
  "CONFIRM",
  "PROCEED",
  "ABORT",
];

/** Reply used when nothing in the protocol matches. */
export const FALLBACK_RESPONSE: IntercomResponse = "FIONA";

export const mod11IntercomConfig: ModuleConfig<"MOD_11_INTERCOM"> = {
  id: "MOD_11_INTERCOM",
  name: "Intercom",
  kind: "Translation Component",
  rules: {
    messages: MESSAGES,
    dictionary: DICTIONARY,
    protocol: PROTOCOL,
    responses: RESPONSES,
    fallbackResponse: FALLBACK_RESPONSE,
    infoNotes: {
      info2: "FIONA is not in the protocol — never press it.",
    },
  },
};
