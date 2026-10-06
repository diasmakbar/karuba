import { useState } from "react";
import type { BandId, Sliders } from "../../types/db-schema";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState, definitionById } from "../../lib/modules";
import { BANDS, BAND_LABELS } from "../../lib/modules/mod07Equalizer";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";
import { MODULE_GOALS } from "./goals";

/**
 * MOD_07_EQUALIZER — a difficulty-scaled set of sliders (1-5) plus a serial and hardware
 * revision. Info 1 gives the target profile; Info 2 says how the revision mangles the physical
 * slider value. Answer: the physical positions keyed by band.
 *
 * The bands come from the per-instance `bands` dealt at generate time (3 / 5 / 7 by difficulty).
 */
export function EqualizerConsole({ state, disabled, submit, difficulty }: ModuleConsoleProps) {
  const { localVars } = narrowModuleState(state, "MOD_07_EQUALIZER");
  const bands: BandId[] = Array.isArray(localVars.bands) && localVars.bands.length > 0
    ? (localVars.bands as BandId[])
    : (BANDS.slice(0, 3) as BandId[]);
  const [sliders, setSliders] = useState<Sliders>(() => {
    const initial: Sliders = {};
    for (const band of bands) initial[band] = 1;
    return initial;
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const setBand = (key: BandId, value: number) => {
    if (disabled || pending || state.isSolved) return;
    setSliders((current) => ({ ...current, [key]: value }));
  };

  const confirm = async () => {
    if (disabled || pending || state.isSolved) return;
    setPending(true);
    setFeedback(null);
    try {
      const outcome = await submit(sliders);
      setFeedback(outcomeMessage(outcome));
    } finally {
      setPending(false);
    }
  };

  return (
    <BaseModuleWrapper
      title={definitionById("MOD_07_EQUALIZER").name}
      isSolved={state.isSolved}
      disabled={disabled}
      strikeSignal={0}
      goal={MODULE_GOALS.MOD_07_EQUALIZER}
      showGoalHint={difficulty === "BEGINNER"}
    >
      <div className="serial">
        SN {localVars.serialNumber} · {localVars.hardwareRevision}
      </div>
      <div className="sliders">
        {bands.map((band) => (
          <div key={band} className="slider-col">
            <span className="tag">{BAND_LABELS[band]}</span>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={sliders[band] ?? 1}
              disabled={disabled || pending || state.isSolved}
              onChange={(event) => setBand(band, Number(event.target.value))}
              aria-label={BAND_LABELS[band]}
            />
            <span className="hud-value">{sliders[band] ?? 1}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-block"
        disabled={disabled || pending || state.isSolved}
        onClick={confirm}
      >
        Submit
      </button>
      <p className="module-feedback">{feedback}</p>
    </BaseModuleWrapper>
  );
}
