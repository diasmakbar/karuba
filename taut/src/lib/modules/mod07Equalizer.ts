import type { HardwareRevision, Sliders } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
import { endsWithEven, randomSerialNumber } from "../rng";

/** Info1_Baseline: the target audio profile keyed by serial parity. */
export const TARGET_PROFILE: Record<"even" | "odd", Sliders> = {
  even: { bass: 4, mid: 2, treble: 5 },
  odd: { bass: 1, mid: 5, treble: 3 },
};

/** Info2_Modifier: known firmware bugs on each hardware revision. */
export const HARDWARE_BUGS: Record<HardwareRevision, string> = {
  "Rev 1.0": "Firmware clean — every slider outputs the position you set.",
  "Rev 1.2": "Mid channel outputs 2 steps HIGH: set the mid slider 2 steps BELOW the target (never below 1).",
  "Rev 1.4": "Bass channel is inverted: the output is 6 minus the physical position, so set bass to 6 minus the target.",
};

function profileKey(serialNumber: string): "even" | "odd" {
  return endsWithEven(serialNumber) ? "even" : "odd";
}

/** What the console screen reports for the given physical slider positions. */
export function outputProfile(revision: HardwareRevision, physical: Sliders): Sliders {
  return {
    bass: revision === "Rev 1.4" ? 6 - physical.bass : physical.bass,
    mid: revision === "Rev 1.2" ? Math.min(5, physical.mid + 2) : physical.mid,
    treble: physical.treble,
  };
}

/** The physical positions that produce the Info 1 profile despite the firmware bug. */
export function requiredPositions(revision: HardwareRevision, serialNumber: string): Sliders {
  const target = TARGET_PROFILE[profileKey(serialNumber)];
  return {
    bass: revision === "Rev 1.4" ? 6 - target.bass : target.bass,
    mid: revision === "Rev 1.2" ? Math.max(1, target.mid - 2) : target.mid,
    treble: target.treble,
  };
}

export const mod07Equalizer: ModuleDefinition<"MOD_07_EQUALIZER"> = {
  id: "MOD_07_EQUALIZER",
  name: "Equalizer",
  kind: "Math Component",
  generate: (rng) => ({
    serialNumber: randomSerialNumber(rng),
    hardwareRevision: rng.pick(["Rev 1.0", "Rev 1.2", "Rev 1.4"] as const),
  }),
  info1: (vars) => [
    {
      title: "Target output profile (Info 1)",
      columns: ["Serial ends in", "Bass out", "Mid out", "Treble out"],
      rows: [
        { cells: ["EVEN digit", "4", "2", "5"], highlight: profileKey(vars.serialNumber) === "even" },
        { cells: ["ODD digit", "1", "5", "3"], highlight: profileKey(vars.serialNumber) === "odd" },
      ],
      note: "These are the values the output screen must read — not necessarily the slider positions.",
    },
  ],
  info2: (vars) => [
    {
      title: "Hardware revision bugs (Info 2)",
      columns: ["Revision", "Known fault"],
      rows: (["Rev 1.0", "Rev 1.2", "Rev 1.4"] as const).map((revision) => ({
        cells: [revision, HARDWARE_BUGS[revision]],
        highlight: revision === vars.hardwareRevision,
      })),
      note: "Help the owner convert the target profile into physical slider positions.",
    },
  ],
  verify: (vars, answer) => {
    const required = requiredPositions(vars.hardwareRevision, vars.serialNumber);
    return required.bass === answer.bass && required.mid === answer.mid && required.treble === answer.treble;
  },
  status: () => "Match the output screen to the announced profile, then submit",
};
