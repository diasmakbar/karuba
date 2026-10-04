import type { IntercomMessage, IntercomResponse } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Intercom module (MOD_11).
 */

/** Incoming transmissions the module can deal (>= 10). */
export const MESSAGES: readonly IntercomMessage[] = [
  "KOSONG",   // Owner: "Layar gw KOSONG." Informan: "Kosong blank, apa tulisannya K-O-S-O-N-G?"
  "APA",      // Owner: "Tulisannya APA." Informan: "Lah gw nanya lo, tulisannya apa?!"
  "TUNGGU",   // Owner: "TUNGGU." Informan: "Oke gw tungguin... buruan sebut!"
  "BENTAR",
  "HAH",
  "SPASI",
  "TITIK",
  "GAK ADA",
  "UDAH",
  "BELUM",
];

/** Info1_Baseline: dictionary of the incoming transmissions (one distinct meaning each). */
export const DICTIONARY: Record<IntercomMessage, string> = {
  "KOSONG": "Zero Data",
  "APA": "Query Unknown",
  "TUNGGU": "Standby Mode",
  "BENTAR": "Awaiting Input",
  "HAH": "Signal Lost",
  "SPASI": "Space Detected",
  "TITIK": "End of Line",
  "GAK ADA": "Target Unclear",
  "UDAH": "Process Complete",
  "BELUM": "Process Pending",
};

/** Info2_Modifier: the required reply for each meaning. */
export const PROTOCOL: Record<string, IntercomResponse> = {
  "Zero Data": "ISI",          // Owner: "Masa gw disuruh ISI? Gak ada keyboard!" Informan: "Tombolnya namanya ISI!"
  "Query Unknown": "ULANG",
  "Standby Mode": "LANJUT",
  "Awaiting Input": "TEKAN",   // Owner: "Pencet apa?" Informan: "TEKAN!" Owner: "Iya nekan apa?!"
  "Signal Lost": "BIARIN",
  "Space Detected": "HAPUS",
  "End of Line": "KOMA",       // Sengaja dituker biar bingung
  "Target Unclear": "ITU",
  "Process Complete": "TIDAK",
  "Process Pending": "IYA",
};

/** Candidate replies on the console (>= 10); the ones not in the protocol are decoys. */
export const RESPONSES: readonly IntercomResponse[] = [
  "ISI",
  "ULANG",
  "LANJUT",
  "TEKAN",
  "BIARIN",
  "HAPUS",
  "KOMA",
  "TITIK",
  "TIDAK",
  "IYA",
  "ITU",
];

/** Reply used when nothing in the protocol matches. */
export const FALLBACK_RESPONSE: IntercomResponse = "BIARIN";

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
      info2: "BIARIN is the default response if communication fully breaks down.",
    },
  },
};