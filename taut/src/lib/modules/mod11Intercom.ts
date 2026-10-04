import type { IntercomMessage, IntercomResponse } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
import {
  DICTIONARY,
  FALLBACK_RESPONSE,
  MESSAGES,
  PROTOCOL,
  RESPONSES,
  mod11IntercomConfig,
} from "./config/mod11Intercom.config";

/** Info1_Baseline: dictionary of the incoming transmissions. */
export { DICTIONARY };
/** Info2_Modifier: the required reply for each meaning. */
export { PROTOCOL };
export { RESPONSES };

export function requiredResponse(message: IntercomMessage): IntercomResponse {
  return PROTOCOL[DICTIONARY[message]] ?? FALLBACK_RESPONSE;
}

export const mod11Intercom: ModuleDefinition<"MOD_11_INTERCOM"> = {
  config: mod11IntercomConfig,
  id: mod11IntercomConfig.id,
  name: mod11IntercomConfig.name,
  kind: mod11IntercomConfig.kind,
  generate: (rng) => ({ incomingMessage: rng.pick(MESSAGES) }),
  info1: (vars) => [
    {
      title: "Transmission dictionary (Info 1)",
      columns: ["Incoming word", "Meaning"],
      rows: MESSAGES.map((word) => ({
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
