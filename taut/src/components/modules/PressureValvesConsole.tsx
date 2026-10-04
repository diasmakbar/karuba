import { useState } from "react";
import type { ValveId } from "../../types/db-schema";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState, definitionById } from "../../lib/modules";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";

/**
 * MOD_10_PRESSURE_VALVES — a starting pressure, serial and the dealt valves. Info 1 gives the
 * target pressure for the serial; Info 2 gives each valve's flow. Answer: the set of open valves.
 *
 * The valves come from the per-instance `activeValves` dealt at generate time (4 / 6 / 8 by
 * difficulty); never a hard-coded list.
 */
export function PressureValvesConsole({ state, disabled, submit }: ModuleConsoleProps) {
  const { localVars } = narrowModuleState(state, "MOD_10_PRESSURE_VALVES");
  const valves: ValveId[] = Array.isArray(localVars.activeValves) && localVars.activeValves.length > 0
    ? (localVars.activeValves as ValveId[])
    : ["A", "B", "C", "D"];
  const [active, setActive] = useState<ValveId[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const toggle = (valve: ValveId) => {
    if (disabled || pending || state.isSolved) return;
    setActive((current) =>
      current.includes(valve) ? current.filter((v) => v !== valve) : [...current, valve],
    );
  };

  const confirm = async () => {
    if (disabled || pending || state.isSolved) return;
    setPending(true);
    setFeedback(null);
    try {
      const outcome = await submit({ valves: active });
      setFeedback(outcomeMessage(outcome));
    } finally {
      setPending(false);
    }
  };

  return (
    <BaseModuleWrapper
      title={definitionById("MOD_10_PRESSURE_VALVES").name}
      isSolved={state.isSolved}
      disabled={disabled}
      strikeSignal={0}
    >
      <div className="screen">
        <span className="tag">Pressure</span>
        <div className="font-display">{localVars.currentPressure}</div>
        <div className="serial">SN {localVars.serialNumber}</div>
      </div>
      <div className="valves">
        {valves.map((valve) => (
          <button
            key={valve}
            type="button"
            className={`toggle ${active.includes(valve) ? "is-on" : ""}`}
            disabled={disabled || pending || state.isSolved}
            onClick={() => toggle(valve)}
          >
            {valve}
          </button>
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
