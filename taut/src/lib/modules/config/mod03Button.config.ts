import type { Cipher } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Big Red Button module (MOD_03).
 *
 * Cipher table, timing rules and the shared-clock digits are all data. Edit the cipher
 * mapping or the release conditions here without touching `mod03Button.ts`.
 */

export type ButtonCommand = "HOLD" | "PUSH" | "WAIT" | "DROP";

/** Ciphers the button can display. */
export const CIPHERS: readonly Cipher[] = ["XYZA", "VBNM"];

/**
 * Info1_Baseline: the cipher decryption table keyed by serial parity.
 * `even`/`odd` refer to the last digit of the serial number.
 */
export const CIPHER_TABLE: Record<Cipher, Record<"even" | "odd", ButtonCommand>> = {
  XYZA: { even: "HOLD", odd: "WAIT" },
  VBNM: { even: "PUSH", odd: "DROP" },
};

/** How the release condition is expressed for each command. */
export type ReleaseCondition =
  | { kind: "clockContains"; digit: number }
  | { kind: "secondsEven" }
  | { kind: "immediate" };

/** Info2_Modifier: what each decrypted command requires from the holder. */
export const TIMING_RULES: Record<ButtonCommand, { text: string; condition: ReleaseCondition }> = {
  HOLD: {
    text: "Press to start holding, keep holding, and release only while the shared clock CONTAINS the digit 4 anywhere in MM:SS.",
    condition: { kind: "clockContains", digit: 4 },
  },
  WAIT: {
    text: "Press to start holding, keep holding, and release only while the shared clock CONTAINS the digit 1 anywhere in MM:SS.",
    condition: { kind: "clockContains", digit: 1 },
  },
  PUSH: {
    text: "Press to start holding, then release only while the shared clock's SECONDS are even.",
    condition: { kind: "secondsEven" },
  },
  DROP: {
    text: "Release immediately — press and let go at once.",
    condition: { kind: "immediate" },
  },
};

/** Display order used by the Info 2 manual. */
export const COMMAND_ORDER: readonly ButtonCommand[] = ["HOLD", "WAIT", "PUSH", "DROP"];

export const mod03ButtonConfig: ModuleConfig<"MOD_03_BUTTON"> = {
  id: "MOD_03_BUTTON",
  name: "Big Red Button",
  kind: "Timing Component",
  rules: {
    ciphers: CIPHERS,
    cipherTable: CIPHER_TABLE,
    timingRules: TIMING_RULES,
    commandOrder: COMMAND_ORDER,
    infoNotes: {
      info2:
        "Everyone reads the same shared clock. Call out the full MM:SS as it ticks and trust the room clock.",
    },
  },
};
