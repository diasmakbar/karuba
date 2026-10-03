import type { Cipher } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
import { endsWithEven, randomSerialNumber } from "../rng";

export type ButtonCommand = "HOLD" | "PUSH" | "WAIT" | "DROP";

/** Info1_Baseline: the cipher decryption table keyed by serial parity. */
export function decryptCipher(cipher: Cipher, serialNumber: string): ButtonCommand {
  const even = endsWithEven(serialNumber);
  if (cipher === "XYZA") return even ? "HOLD" : "WAIT";
  return even ? "PUSH" : "DROP";
}

/** The countdown screen rolls 1 → 9 forever, one second per value. */
export function countdownValue(elapsedMs: number): number {
  return (Math.max(0, Math.floor(elapsedMs / 1000)) % 9) + 1;
}

export function isEvenSecond(elapsedMs: number): boolean {
  return countdownValue(elapsedMs) % 2 === 0;
}

/** Info2_Modifier: what the decrypted command actually requires from the holder. */
export function timingRule(command: ButtonCommand): string {
  switch (command) {
    case "HOLD":
      return "Press to start holding, keep holding, and release only while the countdown screen shows 4.";
    case "WAIT":
      return "Press to start holding, keep holding, and release only while the countdown screen shows 1.";
    case "PUSH":
      return "Press to start holding, then release only while the countdown screen shows an EVEN number (2, 4, 6, 8).";
    case "DROP":
      return "Release immediately — press and let go at once.";
  }
}

export const mod03Button: ModuleDefinition<"MOD_03_BUTTON"> = {
  id: "MOD_03_BUTTON",
  name: "Big Red Button",
  kind: "Timing Component",
  generate: (rng) => ({
    cipher: rng.pick(["XYZA", "VBNM"] as const),
    serialNumber: randomSerialNumber(rng),
    isHolding: false,
    holdStartedAt: null,
  }),
  info1: (vars) => [
    {
      title: "Cipher decryption (Info 1)",
      columns: ["Serial ends in", "XYZA", "VBNM"],
      rows: [
        { cells: ["EVEN digit", "HOLD", "PUSH"], highlight: endsWithEven(vars.serialNumber) },
        { cells: ["ODD digit", "WAIT", "DROP"], highlight: !endsWithEven(vars.serialNumber) },
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
        rows: (["HOLD", "WAIT", "PUSH", "DROP"] as const).map((item) => ({
          cells: [item, timingRule(item)],
          highlight: item === command,
        })),
        note: "The countdown screen rolls 1-9, one number per second, and the owner cannot see it.",
      },
    ];
  },
  verify: (vars, answer) => {
    const command = decryptCipher(vars.cipher, vars.serialNumber);
    if (answer.action === "EARLY") return false;
    const releasedNow = answer.action === "RELEASE_NOW";
    switch (command) {
      case "DROP":
        return releasedNow;
      case "PUSH":
        return releasedNow && isEvenSecond(answer.elapsedMs);
      case "HOLD":
        return answer.action === "HOLD_TO_TARGET" && countdownValue(answer.elapsedMs) === 4;
      case "WAIT":
        return answer.action === "HOLD_TO_TARGET" && countdownValue(answer.elapsedMs) === 1;
    }
  },
  status: (vars) => (vars.isHolding ? "Holding — release on the number your informant calls" : "Idle — press to start the hold"),
};
