import type { IntercomMessage } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
import { vocabSize } from "../gameConfig";
import { DICTIONARY, MESSAGES, MEANINGS, mod11IntercomConfig } from "./config/mod11Intercom.config";

export function createMeaningMap(rng: { shuffle: <T>(items: readonly T[]) => T[] }): Record<string, string> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const shuffled = rng.shuffle(MEANINGS);
    if (MEANINGS.every((meaning, index) => shuffled[index] !== meaning)) {
      return Object.fromEntries(MEANINGS.map((meaning, index) => [meaning, shuffled[index]]));
    }
  }
  // Deterministic cyclic shift is a guaranteed derangement fallback.
  return Object.fromEntries(MEANINGS.map((meaning, index) => [meaning, MEANINGS[(index + 1) % MEANINGS.length]]));
}

export function finalMessageFor(incomingMessage: IntercomMessage, meaningMap: Record<string, string>): IntercomMessage {
  const meaningToMessage = Object.fromEntries(Object.entries(DICTIONARY).map(([message, meaning]) => [meaning, message])) as Record<string, IntercomMessage>;
  const firstMeaning = DICTIONARY[incomingMessage];
  const mappedMeaning = meaningMap[firstMeaning];
  return meaningToMessage[mappedMeaning];
}

export const mod11Intercom: ModuleDefinition<"MOD_11_INTERCOM"> = {
  config: mod11IntercomConfig,
  id: mod11IntercomConfig.id,
  name: mod11IntercomConfig.name,
  kind: mod11IntercomConfig.kind,
  generate: (rng, difficulty) => {
    const incomingMessage = rng.pick(MESSAGES);
    const meaningMap = createMeaningMap(rng);
    const finalMessage = finalMessageFor(incomingMessage, meaningMap);
    const choiceCount = Math.min(vocabSize(difficulty), MESSAGES.length);
    const decoys = rng.shuffle(MESSAGES.filter((message) => message !== finalMessage)).slice(0, choiceCount - 1);
    const messages = rng.shuffle<IntercomMessage>([finalMessage, ...decoys]);
    return { incomingMessage, messages, meaningMap };
  },
  info1: () => [{
    title: "Transmission dictionary (Info 1)",
    columns: ["Incoming message", "Meaning"],
    // Informant 1 needs the complete dictionary for the final lookup after Info 2.
    rows: MESSAGES.map((message) => ({ cells: [message, DICTIONARY[message]], highlight: false })),
    note: "Translate the owner's incoming message. The owner may return with a meaning from Info 2 to look up as a final message.",
  }],
  info2: (vars) => [{
    title: "Meaning relay (Info 2)",
    columns: ["Meaning received", "Relay meaning"],
    rows: MEANINGS.map((meaning) => ({
      cells: [meaning, vars.meaningMap?.[meaning] ?? "—"],
      highlight: false,
    })),
    note: "Every meaning relays to a different meaning. The owner then takes the relay meaning back to Informant 1 to find the final message.",
  }],
  verify: (vars, answer) => answer.message === finalMessageFor(vars.incomingMessage, vars.meaningMap),
  status: () => "Relay the meaning through Info 2, look up its message in Info 1, and press that message",
};

export { DICTIONARY, MEANINGS };
export function requiredMessage(incomingMessage: IntercomMessage, meaningMap: Record<string, string>): IntercomMessage {
  return finalMessageFor(incomingMessage, meaningMap);
}
