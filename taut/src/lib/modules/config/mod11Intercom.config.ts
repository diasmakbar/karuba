import type { IntercomMessage } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/** Incoming transmissions; each has a unique meaning in Info 1. */
export const MESSAGES: readonly IntercomMessage[] = [
  "KOSONG",
  "APA",
  "TUNGGU",
  "BENTAR",
  "HAH",
  "SPASI",
  "TITIK",
  "GAK ADA",
  "UDAH",
  "BELUM",
];

/** Info 1 dictionary: transmission → English meaning. */
export const DICTIONARY: Record<IntercomMessage, string> = {
  KOSONG: "Zero Data",
  APA: "Query Unknown",
  TUNGGU: "Standby Mode",
  BENTAR: "Awaiting Input",
  HAH: "Signal Lost",
  SPASI: "Space Detected",
  TITIK: "End of Line",
  "GAK ADA": "Target Unclear",
  UDAH: "Process Complete",
  BELUM: "Process Pending",
};

/** Stable meaning vocabulary; Info 2 maps these meanings back through Info 1. */
export const MEANINGS: readonly string[] = Object.values(DICTIONARY);

export const mod11IntercomConfig: ModuleConfig<"MOD_11_INTERCOM"> = {
  id: "MOD_11_INTERCOM",
  name: "Intercom",
  kind: "Two-Stage Translation Component",
  rules: {
    messages: MESSAGES,
    dictionary: DICTIONARY,
    meanings: MEANINGS,
    info1: "Translate the incoming message to its meaning. The final answer is found by looking up the returned meaning here.",
    info2: "Each meaning maps to a randomized DIFFERENT meaning; no meaning maps to itself.",
    flow: "incoming message → Info 1 meaning → Info 2 mapped meaning → Info 1 message",
  },
};
