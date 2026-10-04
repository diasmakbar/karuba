import type { HardwareRevision, Sliders } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
import { endsWithEven, randomSerialNumber } from "../rng";
import {
  REVISIONS,
  REVISION_MODELS,
  SLIDER_MAX,
  SLIDER_MIN,
  TARGET_PROFILE,
  mod07EqualizerConfig,
  type ChannelTransform,
} from "./config/mod07Equalizer.config";

/** Info1_Baseline: the target audio profile keyed by serial parity. */
export { TARGET_PROFILE };
/** Info2_Modifier: known firmware bugs on each hardware revision (descriptions). */
export const HARDWARE_BUGS: Record<HardwareRevision, string> = {
  "Rev 1.0": REVISION_MODELS["Rev 1.0"].text,
  "Rev 1.2": REVISION_MODELS["Rev 1.2"].text,
  "Rev 1.4": REVISION_MODELS["Rev 1.4"].text,
};

function profileKey(serialNumber: string): "even" | "odd" {
  return endsWithEven(serialNumber) ? "even" : "odd";
}

/** Apply one channel transform: physical position -> reported output. */
function applyTransform(transform: ChannelTransform, physical: number): number {
  switch (transform.kind) {
    case "identity":
      return physical;
    case "offsetClamped":
      return Math.min(SLIDER_MAX, physical + transform.delta);
    case "inverted":
      return SLIDER_MAX + SLIDER_MIN - physical;
  }
}

/** Invert a channel transform: reported output -> required physical position. */
function invertTransform(transform: ChannelTransform, target: number): number {
  switch (transform.kind) {
    case "identity":
      return target;
    case "offsetClamped":
      return Math.max(SLIDER_MIN, target - transform.delta);
    case "inverted":
      return SLIDER_MAX + SLIDER_MIN - target;
  }
}

/** What the console screen reports for the given physical slider positions. */
export function outputProfile(revision: HardwareRevision, physical: Sliders): Sliders {
  const model = REVISION_MODELS[revision];
  return {
    bass: applyTransform(model.bass, physical.bass),
    mid: applyTransform(model.mid, physical.mid),
    treble: applyTransform(model.treble, physical.treble),
  };
}

/** The physical positions that produce the Info 1 profile despite the firmware bug. */
export function requiredPositions(revision: HardwareRevision, serialNumber: string): Sliders {
  const target = TARGET_PROFILE[profileKey(serialNumber)];
  const model = REVISION_MODELS[revision];
  return {
    bass: invertTransform(model.bass, target.bass),
    mid: invertTransform(model.mid, target.mid),
    treble: invertTransform(model.treble, target.treble),
  };
}

export const mod07Equalizer: ModuleDefinition<"MOD_07_EQUALIZER"> = {
  config: mod07EqualizerConfig,
  id: mod07EqualizerConfig.id,
  name: mod07EqualizerConfig.name,
  kind: mod07EqualizerConfig.kind,
  generate: (rng, _difficulty) => ({
    serialNumber: randomSerialNumber(rng),
    hardwareRevision: rng.pick(REVISIONS),
  }),
  info1: (vars) => [
    {
      title: "Target output profile (Info 1)",
      columns: ["Serial ends in", "Bass out", "Mid out", "Treble out"],
      rows: [
        {
          cells: ["EVEN digit", String(TARGET_PROFILE.even.bass), String(TARGET_PROFILE.even.mid), String(TARGET_PROFILE.even.treble)],
          highlight: profileKey(vars.serialNumber) === "even",
        },
        {
          cells: ["ODD digit", String(TARGET_PROFILE.odd.bass), String(TARGET_PROFILE.odd.mid), String(TARGET_PROFILE.odd.treble)],
          highlight: profileKey(vars.serialNumber) === "odd",
        },
      ],
      note: "These are the values the output screen must read — not necessarily the slider positions.",
    },
  ],
  info2: (vars) => [
    {
      title: "Hardware revision bugs (Info 2)",
      columns: ["Revision", "Known fault"],
      rows: REVISIONS.map((revision) => ({
        cells: [revision, REVISION_MODELS[revision].text],
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
