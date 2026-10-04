import type { IntercomMessage, IntercomResponse } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Intercom module (MOD_11).
 *
 * The transmission dictionary and reply protocol are data. Swap the words, meanings or replies
 * from this file without touching `mod11Intercom.ts`.
 */

/** Incoming transmissions the module can deal. */
export const MESSAGES: readonly IntercomMessage[] = ["KLAATU", "GORT", "VERATA"];

/** Info1_Baseline: dictionary of the incoming transmissions. */
export const DICTIONARY: Record<IntercomMessage, string> = {
  KLAATU: "Requesting Status",
  GORT: "Hostile Presence",
  VERATA: "Requesting Supply Drop",
};

/** Info2_Modifier: the required reply for each meaning. */
export const PROTOCOL: Record<string, IntercomResponse> = {
  "Requesting Status": "NIKTO",
  "Hostile Presence": "BARADA",
  "Requesting Supply Drop": "SHREK",
};

/** Candidate replies on the console; FIONA is a decoy. */
export const RESPONSES: readonly IntercomResponse[] = ["BARADA", "NIKTO", "SHREK", "FIONA"];

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
