import { useState } from "react";
import type { ModuleConsoleProps } from "./types";
import { narrowModuleState } from "../../lib/modules";
import { definitionById } from "../../lib/modules";
import { BaseModuleWrapper } from "./BaseModuleWrapper";
import { outcomeMessage } from "./outcome";
import { useT } from "../../lib/i18n/useT";
import { MODULE_GOALS } from "./goals";

/**
 * MOD_01_WIRE — three to six colourless wires drawn as connections between a left pin
 * column (A1..AN) and a right pin column (B1..B6). The right pins are strictly
 * increasing, so no wires cross. The owner sees only the physical wires and the serial
 * number; Informant 1 reads the colors, Informant 2 reads the cutting manual.
 * Answer: `{ wireIndex }`.
 */
export function WireConsole({ state, disabled, submit, difficulty }: ModuleConsoleProps) {
  const t = useT();
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
      goal={MODULE_GOALS.MOD_01_WIRE}
      showGoalHint={difficulty === "BEGINNER"}
    >
      <div className="serial">{t("module.serial")} {localVars.serialNumber}</div>
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
          // Split the ORIGINAL cubic at t=0.5 with de Casteljau so each half lies exactly on the
          // wire's own curve. BOTH halves are then drawn FROM THEIR PIN toward the centre, so the
          // cut can retract the inner tip (anchored at the pin) instead of moving the whole wire.
          const p0 = [LEFT_X, y1];
          const p1 = [MID_X, y1];
          const p2 = [MID_X, y2];
          const p3 = [RIGHT_X, y2];
          const mid = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          const m01 = mid(p0, p1);
          const m12 = mid(p1, p2);
          const m23 = mid(p2, p3);
          const m012 = mid(m01, m12);
          const m123 = mid(m12, m23);
          const centre = mid(m012, m123); // exact point at t=0.5 on the original curve
          const pt = (p: number[]) => `${p[0]} ${p[1]}`;
          // Left half: pin -> centre. Right half: pin (p3) -> centre, i.e. the reversed right segment.
          const leftD = `M ${pt(p0)} C ${pt(m01)}, ${pt(m012)}, ${pt(centre)}`;
          const rightD = `M ${pt(p3)} C ${pt(m23)}, ${pt(m123)}, ${pt(centre)}`;
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
                  {/* pathLength=1 normalizes each half so the CSS trim can use fractions. */}
                  <path d={leftD} pathLength={1} className="wire-path is-cut-left" />
                  <path d={rightD} pathLength={1} className="wire-path is-cut-right" />
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
