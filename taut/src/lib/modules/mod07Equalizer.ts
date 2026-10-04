import type { BandId, HardwareRevision, Sliders } from "../../types/db-schema";
import type { ModuleDefinition } from "./contract";
import { equalizerBandCount } from "../gameConfig";
import { endsWithEven, randomSerialNumber } from "../rng";
import {
  BANDS,
  BAND_LABELS,
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
export { BANDS, BAND_LABELS };

function profileKey(serialNumber: string): "even" | "odd" {
  return endsWithEven(serialNumber) ? "even" : "odd";
}

/** The transform a revision applies to a band (identity when the band is not listed). */
function transformFor(revision: HardwareRevision, band: BandId): ChannelTransform {
  return REVISION_MODELS[revision].transforms[band] ?? { kind: "identity" };
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

/** Bands active for the given difficulty (the first N of `BANDS`). */
export function activeBands(difficulty: Parameters<typeof equalizerBandCount>[0]): readonly BandId[] {
  return BANDS.slice(0, equalizerBandCount(difficulty));
}

/** What the console screen reports for the given physical slider positions (active bands only). */
export function outputProfile(revision: HardwareRevision, physical: Sliders): Sliders {
  const result: Sliders = {};
  for (const band of Object.keys(physical) as BandId[]) {
    const value = physical[band];
    if (value === undefined) continue;
    result[band] = applyTransform(transformFor(revision, band), value);
  }
  return result;
}

/** The physical positions that produce the Info 1 profile despite the firmware bug. */
export function requiredPositions(
  revision: HardwareRevision,
  serialNumber: string,
  bands: readonly BandId[] = BANDS,
): Sliders {
  const target = TARGET_PROFILE[profileKey(serialNumber)];
  const result: Sliders = {};
  for (const band of bands) {
    result[band] = invertTransform(transformFor(revision, band), target[band]);
  }
  return result;
}

export const mod07Equalizer: ModuleDefinition<"MOD_07_EQUALIZER"> = {
  config: mod07EqualizerConfig,
  id: mod07EqualizerConfig.id,
  name: mod07EqualizerConfig.name,
  kind: mod07EqualizerConfig.kind,
  generate: (rng, difficulty) => ({
    serialNumber: randomSerialNumber(rng),
    hardwareRevision: rng.pick(REVISIONS),
    // The active bands are fixed by difficulty so the console and the manual agree.
    bands: [...activeBands(difficulty)],
  }),
  info1: (vars) => {
    const key = profileKey(vars.serialNumber);
    const active = Array.isArray(vars.bands) && vars.bands.length > 0 ? vars.bands : [...BANDS.slice(0, 3)];
    return [
      {
        title: "Target output profile (Info 1)",
        columns: ["Serial ends in", ...active.map((band) => BAND_LABELS[band])],
        rows: [
          {
            cells: ["EVEN digit", ...active.map((band) => String(TARGET_PROFILE.even[band]))],
            highlight: key === "even",
          },
          {
            cells: ["ODD digit", ...active.map((band) => String(TARGET_PROFILE.odd[band]))],
            highlight: key === "odd",
          },
        ],
        note: "These are the values the output screen must read — not necessarily the slider positions.",
      },
    ];
  },
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
    const active = Array.isArray(vars.bands) && vars.bands.length > 0 ? vars.bands : [...BANDS.slice(0, 3)];
    const required = requiredPositions(vars.hardwareRevision, vars.serialNumber, active);
    return active.every((band) => required[band] === answer[band]);
  },
  status: () => "Match the output screen to the announced profile, then submit",
};
