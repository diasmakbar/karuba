import type { IntercomMessage, IntercomResponse } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
import { vocabSize } from "../gameConfig";
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
  generate: (rng, difficulty) => {
    const n = vocabSize(difficulty);
    const incomingMessage = rng.pick(MESSAGES);
    const correct = requiredResponse(incomingMessage);
    // Deal `n` incoming words (the owner's among them) and `n` reply options (the correct one among them).
    const otherMessages = rng.shuffle(
      MESSAGES.filter((word) => word !== incomingMessage) as IntercomMessage[],
    );
    const messages = rng.shuffle<IntercomMessage>([incomingMessage, ...otherMessages.slice(0, n - 1)]);
    const otherResponses = rng.shuffle(RESPONSES.filter((reply) => reply !== correct) as IntercomResponse[]);
    const responses = rng.shuffle<IntercomResponse>([correct, ...otherResponses.slice(0, n - 1)]);
    return { incomingMessage, messages, responses };
  },
  info1: (vars) => [
    {
      title: "Transmission dictionary (Info 1)",
      columns: ["Incoming word", "Meaning"],
      rows: (Array.isArray(vars.messages) ? vars.messages : MESSAGES).map((word) => ({
        cells: [word, DICTIONARY[word]],
        highlight: word === vars.incomingMessage,
      })),
    },
  ],
  info2: (vars) => [
    {
      title: "Reply protocol (Info 2)",
      columns: ["Meaning", "Correct reply"],
      rows: (Array.isArray(vars.messages) ? vars.messages : MESSAGES).map((word) => {
        const meaning = DICTIONARY[word];
        return {
          cells: [meaning, PROTOCOL[meaning] ?? FALLBACK_RESPONSE],
          highlight: word === vars.incomingMessage,
        };
      }),
      note: "FIONA is not in the protocol — never press it.",
    },
  ],
  verify: (vars, answer) => answer.response === requiredResponse(vars.incomingMessage),
  status: () => "Press the reply you were told",
};
