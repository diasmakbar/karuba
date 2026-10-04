import type { Cipher } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
import { endsWithEven, randomSerialNumber } from "../rng";
import {
  CIPHER_TABLE,
  CIPHERS,
  COMMAND_ORDER,
  TIMING_RULES,
  mod03ButtonConfig,
  type ButtonCommand,
  type ReleaseCondition,
} from "./config/mod03Button.config";

export type { ButtonCommand };

/** Info1_Baseline: the cipher decryption table keyed by serial parity. */
export function decryptCipher(cipher: Cipher, serialNumber: string): ButtonCommand {
  const even = endsWithEven(serialNumber);
  return CIPHER_TABLE[cipher][even ? "even" : "odd"];
}

/** The MM:SS the room clock shows for a given number of seconds left. */
export function clockLabel(secondsLeft: number): string {
  const total = Math.max(0, Math.floor(secondsLeft));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/** "Contains N" — the digit N appears anywhere in the displayed MM:SS. */
export function clockContains(secondsLeft: number, digit: number): boolean {
  return clockLabel(secondsLeft).includes(String(digit));
}

/** The seconds part of the clock is even (spec: "release on even seconds"). */
export function secondsAreEven(secondsLeft: number): boolean {
  return Math.max(0, Math.floor(secondsLeft)) % 2 === 0;
}

/** Info2_Modifier: what the decrypted command actually requires from the holder. */
export function timingRule(command: ButtonCommand): string {
  return TIMING_RULES[command].text;
}

/** Evaluate a config release condition against the submitted answer. */
function releaseConditionMet(
  condition: ReleaseCondition,
  action: "RELEASE_NOW" | "HOLD_TO_TARGET",
  secondsLeft: number,
): boolean {
  switch (condition.kind) {
    case "immediate":
      return action === "RELEASE_NOW";
    case "secondsEven":
      return action === "RELEASE_NOW" && secondsAreEven(secondsLeft);
    case "clockContains":
      return action === "HOLD_TO_TARGET" && clockContains(secondsLeft, condition.digit);
  }
}

export const mod03Button: ModuleDefinition<"MOD_03_BUTTON"> = {
  config: mod03ButtonConfig,
  id: mod03ButtonConfig.id,
  name: mod03ButtonConfig.name,
  kind: mod03ButtonConfig.kind,
  generate: (rng) => ({
    cipher: rng.pick(CIPHERS),
    serialNumber: randomSerialNumber(rng),
    isHolding: false,
    holdStartedAt: null,
  }),
  info1: (vars) => [
    {
      title: "Cipher decryption (Info 1)",
      columns: ["Serial ends in", ...CIPHERS],
      rows: [
        {
          cells: ["EVEN digit", ...CIPHERS.map((cipher) => CIPHER_TABLE[cipher].even)],
          highlight: endsWithEven(vars.serialNumber),
        },
        {
          cells: ["ODD digit", ...CIPHERS.map((cipher) => CIPHER_TABLE[cipher].odd)],
          highlight: !endsWithEven(vars.serialNumber),
        },
      ],
      note: `The button reads "${vars.cipher}". Read the command it decrypts to out loud.`,
    },
  ],
  info2: (vars) => {
    const command = decryptCipher(vars.cipher, vars.serialNumber);
    return [
      {
        title: "Timing protocol (Info 2)",
        columns: ["Command", "Release rule"],
        rows: COMMAND_ORDER.map((item) => ({
          cells: [item, TIMING_RULES[item].text],
          highlight: item === command,
        })),
        note: "Everyone reads the same shared clock. Call out the full MM:SS as it ticks and trust the room clock.",
      },
    ];
  },
  verify: (vars, answer) => {
    const command = decryptCipher(vars.cipher, vars.serialNumber);
    if (answer.action === "EARLY") return false;
    return releaseConditionMet(TIMING_RULES[command].condition, answer.action, answer.secondsLeft);
  },
  status: (vars) =>
    vars.isHolding
      ? "Holding — release when the shared clock matches your informant"
      : "Idle — press to start the hold",
};
