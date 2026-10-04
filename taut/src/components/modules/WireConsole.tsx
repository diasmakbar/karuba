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
  // Local index of the wire the player just cut with a correct answer. Held here (not only in
  // Firebase) so the split-apart animation plays immediately, even though a solved single-step
  // module writes no further localVars.
  const [cutIndex, setCutIndex] = useState<number | null>(
    typeof localVars.cutIndex === "number" ? localVars.cutIndex : null,
  );

  const cut = async (wireIndex: number) => {
    if (disabled || pending || state.isSolved) return;
    setPending(true);
    setFeedback(null);
    try {
      const outcome = await submit({ wireIndex });
      setFeedback(outcomeMessage(outcome));
      // A correct cut splits THAT wire; a strike leaves the board untouched.
      if (outcome === "SOLVED") setCutIndex(wireIndex);
    } finally {
      setPending(false);
    }
  };

  const wireCount = localVars.wireCount;
  // RTDB drops empty arrays; fall back to the identity mapping (A1->B1, ...) if missing.
  const leftPins = Array.isArray(localVars.leftPins) ? localVars.leftPins : [];
  const rightPins = Array.isArray(localVars.rightPins) ? localVars.rightPins : [];
  const wires = Array.from({ length: wireCount }, (_, i) => ({
    left: leftPins[i] ?? i + 1,
    right: rightPins[i] ?? i + 1,
  }));

  // Board geometry: 6 slots on each side (A1..A6, B1..B6).
  const SLOT = 40;
  const TOP = 24;
  const LEFT_X = 30;
  const RIGHT_X = 270;
  const MID_X = (LEFT_X + RIGHT_X) / 2;
  const height = TOP * 2 + 6 * SLOT;
  const yFor = (slot: number) => TOP + (slot - 1) * SLOT;
  const allSlots = Array.from({ length: 6 }, (_, i) => i + 1);
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
        {allSlots.map((slot) => (
          <g key={`a${slot}`}>
            <circle cx={LEFT_X} cy={yFor(slot)} r={5} className="pin" />
            <text x={LEFT_X - 12} y={yFor(slot) + 4} className="pin-label" textAnchor="end">
              A{slot}
            </text>
          </g>
        ))}
        {allSlots.map((slot) => (
          <g key={`b${slot}`}>
            <circle cx={RIGHT_X} cy={yFor(slot)} r={5} className="pin" />
            <text x={RIGHT_X + 12} y={yFor(slot) + 4} className="pin-label">
              B{slot}
            </text>
          </g>
        ))}

        {wires.map(({ left, right }, i) => {
          const y1 = yFor(left);
          const y2 = yFor(right);
          const d = `M ${LEFT_X} ${y1} C ${MID_X} ${y1}, ${MID_X} ${y2}, ${RIGHT_X} ${y2}`;
          // The two halves that spring apart once the wire is cut. Each is a cubic from a side
          // pin to the centre; a gap opens between them so the break is visible mid-wire.
          const midY = (y1 + y2) / 2;
          const leftD = `M ${LEFT_X} ${y1} C ${MID_X} ${y1}, ${MID_X} ${y1}, ${MID_X} ${midY}`;
          const rightD = `M ${MID_X} ${midY} C ${MID_X} ${y2}, ${MID_X} ${y2}, ${RIGHT_X} ${y2}`;
          const isCut = cutIndex === i;
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
              {isCut ? (
                <>
                  <path d={leftD} className="wire-path is-cut-left" />
                  <path d={rightD} className="wire-path is-cut-right" />
                </>
              ) : (
                <path d={d} className="wire-path" />
              )}
            </g>
          );
        })}
      </svg>
      <p className="module-feedback">{feedback}</p>
    </BaseModuleWrapper>
  );
}
