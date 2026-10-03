import type { ModuleOutcome } from "../../utils/game";

/** Turn a module interaction outcome into user-facing feedback text. */
export function outcomeMessage(outcome: ModuleOutcome): string {
  return outcome === "STRIKE" ? "Strike!" : "Accepted.";
}
