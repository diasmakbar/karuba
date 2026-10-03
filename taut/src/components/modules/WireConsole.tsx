import { useState } from "react";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState } from "../../lib/modules";
import { definitionById } from "../../lib/modules";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";

/**
 * MOD_01_WIRE — three to six colourless wires drawn as connections between a left pin
 * column (A1..AN) and a right pin column (B1..B6). The right pins are strictly
 * increasing, so no wires cross. The owner sees only the physical wires and the serial
 * number; Informant 1 reads the colors, Informant 2 reads the cutting manual.
 * Answer: `{ wireIndex }`.
 */
export function WireConsole({ state, disabled, submit }: ModuleConsoleProps) {
  const { localVars } = narrowModuleState(state, "MOD_01_WIRE");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const cut = async (wireIndex: number) => {
    if (disabled || pending || state.isSolved) return;
    setPending(true);
    setFeedback(null);
    try {
      const outcome = await submit({ wireIndex });
      setFeedback(outcomeMessage(outcome));
    } finally {
      setPending(false);
    }
  };

  const wireCount = localVars.wireCount;
  // RTDB drops empty arrays; fall back to the identity mapping (A1->B1, ...) if missing.
  const rightPins = Array.isArray(localVars.rightPins) ? localVars.rightPins : [];
  const pins = Array.from({ length: wireCount }, (_, i) => rightPins[i] ?? i + 1);

  // Board geometry: 6 slots (B1..B6), left pins occupy the top N slots.
  const SLOT = 40;
  const TOP = 24;
  const LEFT_X = 30;
  const RIGHT_X = 270;
  const MID_X = (LEFT_X + RIGHT_X) / 2;
  const height = TOP * 2 + 6 * SLOT;
  const yFor = (slot: number) => TOP + (slot - 1) * SLOT;
  const leftSlots = Array.from({ length: wireCount }, (_, i) => i + 1);
  const rightSlots = Array.from({ length: 6 }, (_, i) => i + 1);
  const locked = disabled || pending || state.isSolved;

  return (
    <BaseModuleWrapper
      title={definitionById("MOD_01_WIRE").name}
      isSolved={state.isSolved}
      disabled={disabled}
      strikeSignal={0}
    >
      <div className="serial">SN {localVars.serialNumber}</div>
      <svg
        className={`wire-board ${locked ? "is-locked" : ""}`}
        viewBox={`0 0 300 ${height}`}
        role="group"
        aria-label={`Wire board with ${wireCount} wires`}
      >
        <defs>
          <linearGradient id="wireGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9aa3b2" />
            <stop offset="100%" stopColor="#6f7887" />
          </linearGradient>
        </defs>

        {leftSlots.map((slot) => (
          <g key={`a${slot}`}>
            <circle cx={LEFT_X} cy={yFor(slot)} r={5} className="pin" />
            <text x={LEFT_X - 12} y={yFor(slot) + 4} className="pin-label" textAnchor="end">
              A{slot}
            </text>
          </g>
        ))}
        {rightSlots.map((slot) => (
          <g key={`b${slot}`}>
            <circle cx={RIGHT_X} cy={yFor(slot)} r={5} className="pin" />
            <text x={RIGHT_X + 12} y={yFor(slot) + 4} className="pin-label">
              B{slot}
            </text>
          </g>
        ))}

        {pins.map((rightSlot, i) => {
          const y1 = yFor(i + 1);
          const y2 = yFor(rightSlot);
          const d = `M ${LEFT_X} ${y1} C ${MID_X} ${y1}, ${MID_X} ${y2}, ${RIGHT_X} ${y2}`;
          const isCut = localVars.cutIndex === i;
          return (
            <g
              key={i}
              className="wire"
              role="button"
              tabIndex={locked ? -1 : 0}
              aria-label={`Cut wire ${i + 1}`}
              onClick={() => cut(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  cut(i);
                }
              }}
            >
              <path d={d} className="wire-hit" />
              <path d={d} className={`wire-path ${isCut ? "is-cut" : ""}`} />
            </g>
          );
        })}
      </svg>
      <p className="module-feedback">{feedback}</p>
    </BaseModuleWrapper>
  );
}
