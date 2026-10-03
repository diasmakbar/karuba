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
  switch (command) {
    case "HOLD":
      return "Press to start holding, keep holding, and release only while the shared clock CONTAINS the digit 4 anywhere in MM:SS.";
    case "WAIT":
      return "Press to start holding, keep holding, and release only while the shared clock CONTAINS the digit 1 anywhere in MM:SS.";
    case "PUSH":
      return "Press to start holding, then release only while the shared clock's SECONDS are even.";
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
        note: "Everyone reads the same shared clock. Call out the full MM:SS as it ticks and trust the room clock.",
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
        return releasedNow && secondsAreEven(answer.secondsLeft);
      case "HOLD":
        return answer.action === "HOLD_TO_TARGET" && clockContains(answer.secondsLeft, 4);
      case "WAIT":
        return answer.action === "HOLD_TO_TARGET" && clockContains(answer.secondsLeft, 1);
    }
  },
  status: (vars) =>
    vars.isHolding
      ? "Holding — release when the shared clock matches your informant"
      : "Idle — press to start the hold",
};
