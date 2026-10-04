import type { HardwareRevision, Sliders } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Equalizer module (MOD_07).
 *
 * Target profiles and firmware-bug models are data. Add a hardware revision by describing
 * its channel transform here; `mod07Equalizer.ts` applies the transform generically.
 */

/** Slider range, inclusive. */
export const SLIDER_MIN = 1;
export const SLIDER_MAX = 5;

/** Hardware revisions the module can deal. */
export const REVISIONS: readonly HardwareRevision[] = ["Rev 1.0", "Rev 1.2", "Rev 1.4"];

/** Per-channel firmware behaviour for a revision. */
export type ChannelTransform =
  | { kind: "identity" }
  | { kind: "offsetClamped"; delta: number }
  | { kind: "inverted" };

export interface RevisionModel {
  /** Human-readable description of the fault (Info 2). */
  text: string;
  bass: ChannelTransform;
  mid: ChannelTransform;
  treble: ChannelTransform;
}

/** Info1_Baseline: the target audio profile keyed by serial parity. */
export const TARGET_PROFILE: Record<"even" | "odd", Sliders> = {
  even: { bass: 4, mid: 2, treble: 5 },
  odd: { bass: 1, mid: 5, treble: 3 },
};

/** Info2_Modifier: firmware behaviour per revision. */
export const REVISION_MODELS: Record<HardwareRevision, RevisionModel> = {
  "Rev 1.0": {
    text: "Firmware clean — every slider outputs the position you set.",
    bass: { kind: "identity" },
    mid: { kind: "identity" },
    treble: { kind: "identity" },
  },
  "Rev 1.2": {
    text: "Mid channel outputs 2 steps HIGH: set the mid slider 2 steps BELOW the target (never below 1).",
    bass: { kind: "identity" },
    mid: { kind: "offsetClamped", delta: 2 },
    treble: { kind: "identity" },
  },
  "Rev 1.4": {
    text: "Bass channel is inverted: the output is 6 minus the physical position, so set bass to 6 minus the target.",
    bass: { kind: "inverted" },
    mid: { kind: "identity" },
    treble: { kind: "identity" },
  },
};

export const mod07EqualizerConfig: ModuleConfig<"MOD_07_EQUALIZER"> = {
  id: "MOD_07_EQUALIZER",
  name: "Equalizer",
  kind: "Math Component",
  rules: {
    sliderMin: SLIDER_MIN,
    sliderMax: SLIDER_MAX,
    revisions: REVISIONS,
    targetProfile: TARGET_PROFILE,
    revisionModels: REVISION_MODELS,
    infoNotes: {
      info1: "These are the values the output screen must read — not necessarily the slider positions.",
      info2: "Help the owner convert the target profile into physical slider positions.",
    },
  },
};
