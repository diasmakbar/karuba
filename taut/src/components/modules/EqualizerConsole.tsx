import { useState } from "react";
import type { Sliders } from "../../types/db-schema";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState, definitionById } from "../../lib/modules";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";

const BANDS: { key: keyof Sliders; label: string }[] = [
  { key: "bass", label: "Bass" },
  { key: "mid", label: "Mid" },
  { key: "treble", label: "Treble" },
];

/**
 * MOD_07_EQUALIZER — three sliders (1-5) plus a serial and hardware revision. Info 1 gives the
 * target profile; Info 2 says how the revision mangles the physical slider value. Answer: the
 * physical `{ bass, mid, treble }` positions.
 */
export function EqualizerConsole({ state, disabled, submit }: ModuleConsoleProps) {
  const { localVars } = narrowModuleState(state, "MOD_07_EQUALIZER");
  const [sliders, setSliders] = useState<Sliders>({ bass: 1, mid: 1, treble: 1 });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const setBand = (key: keyof Sliders, value: number) => {
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
    >
      <div className="serial">
        SN {localVars.serialNumber} · {localVars.hardwareRevision}
      </div>
      <div className="sliders">
        {BANDS.map(({ key, label }) => (
          <div key={key} className="slider-col">
            <span className="tag">{label}</span>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={sliders[key]}
              disabled={disabled || pending || state.isSolved}
              onChange={(event) => setBand(key, Number(event.target.value))}
              aria-label={label}
            />
            <span className="hud-value">{sliders[key]}</span>
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
