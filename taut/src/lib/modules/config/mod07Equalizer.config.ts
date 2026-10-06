import type { BandId, HardwareRevision, Sliders } from "../../../types/db-schema";
import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Equalizer module (MOD_07).
 *
 * Slider range, the ordered band list, target profiles and firmware-bug models are all data.
 * A difficulty shows a prefix of `BANDS` (3 / 5 / 7 sliders). Add a revision by describing its
 * per-band transform here; `mod07Equalizer.ts` applies the transform generically.
 */

/** Slider range, inclusive. */
export const SLIDER_MIN = 1;
export const SLIDER_MAX = 5;

/**
 * All equalizer bands, ordered low → high. The runtime shows the first N (Beginner 3, Standard 5,
 * Extreme 7), so the first three are the classic bass / mid / treble trio.
 */
export const BANDS: readonly BandId[] = ["bass", "mid", "treble", "lowMid", "highMid", "presence", "air"];

/** Display labels for each band. */
export const BAND_LABELS: Record<BandId, string> = {
  bass: "Low",
  lowMid: "Low Mid",
  mid: "Mid",
  treble: "High",
  highMid: "High Mid",
  presence: "Presence",
  air: "Air",
};

/** Hardware revisions the module can deal. */
export const REVISIONS: readonly HardwareRevision[] = ["Rev 1.0", "Rev 1.2", "Rev 1.4"];

/** Per-band firmware behaviour for a revision. A missing band means identity (clean). */
export type ChannelTransform =
  | { kind: "identity" }
  | { kind: "offsetClamped"; delta: number }
  | { kind: "inverted" };

export interface RevisionModel {
  /** Human-readable description of the fault (Info 2). */
  text: string;
  /** Overrides applied to specific bands; bands not listed are clean. */
  transforms: Partial<Record<BandId, ChannelTransform>>;
}

/**
 * Info1_Baseline: the target output profile keyed by serial parity, covering EVERY band. Only the
 * bands active for the current difficulty are shown to the informant.
 */
export const TARGET_PROFILE: Record<"even" | "odd", Required<Sliders>> = {
  even: { bass: 4, lowMid: 3, mid: 2, highMid: 3, treble: 5, presence: 4, air: 2 },
  odd: { bass: 1, lowMid: 4, mid: 5, highMid: 2, treble: 3, presence: 5, air: 4 },
};

/** Info2_Modifier: firmware behaviour per revision. */
export const REVISION_MODELS: Record<HardwareRevision, RevisionModel> = {
  "Rev 1.0": {
    text: "Firmware clean — every slider outputs the position you set.",
    transforms: {},
  },
  "Rev 1.2": {
    text: "Mid channel outputs 2 steps HIGH: set the mid slider 2 steps BELOW the target (never below 1).",
    transforms: { mid: { kind: "offsetClamped", delta: 2 } },
  },
  "Rev 1.4": {
    text: "Bass channel is inverted: the output is 6 minus the physical position, so set bass to 6 minus the target.",
    transforms: { bass: { kind: "inverted" } },
  },
};

export const mod07EqualizerConfig: ModuleConfig<"MOD_07_EQUALIZER"> = {
  id: "MOD_07_EQUALIZER",
  name: "Equalizer",
  kind: "Math Component",
  rules: {
    sliderMin: SLIDER_MIN,
    sliderMax: SLIDER_MAX,
    bands: BANDS,
    bandLabels: BAND_LABELS,
    revisions: REVISIONS,
    targetProfile: TARGET_PROFILE,
    revisionModels: REVISION_MODELS,
    infoNotes: {
      info1: "These are the values the output screen must read — not necessarily the slider positions.",
      info2: "Help the owner convert the target profile into physical slider positions.",
    },
  },
};
