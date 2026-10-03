import type { IntercomMessage, IntercomResponse } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";

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

export const RESPONSES: readonly IntercomResponse[] = ["BARADA", "NIKTO", "SHREK", "FIONA"];

export function requiredResponse(message: IntercomMessage): IntercomResponse {
  return PROTOCOL[DICTIONARY[message]] ?? "FIONA";
}

export const mod11Intercom: ModuleDefinition<"MOD_11_INTERCOM"> = {
  id: "MOD_11_INTERCOM",
  name: "Intercom",
  kind: "Translation Component",
  generate: (rng) => ({ incomingMessage: rng.pick(["KLAATU", "GORT", "VERATA"] as const) }),
  info1: (vars) => [
    {
      title: "Transmission dictionary (Info 1)",
      columns: ["Incoming word", "Meaning"],
      rows: (["KLAATU", "GORT", "VERATA"] as const).map((word) => ({
        cells: [word, DICTIONARY[word]],
        highlight: word === vars.incomingMessage,
      })),
    },
  ],
  info2: (vars) => [
    {
      title: "Reply protocol (Info 2)",
      columns: ["Meaning", "Correct reply"],
      rows: Object.entries(PROTOCOL).map(([meaning, reply]) => ({
        cells: [meaning, reply],
        highlight: meaning === DICTIONARY[vars.incomingMessage],
      })),
      note: "FIONA is not in the protocol — never press it.",
    },
  ],
  verify: (vars, answer) => answer.response === requiredResponse(vars.incomingMessage),
  status: () => "Press the reply you were told",
};
