import type { ModuleDefinition } from "./contract";
import { pickDistinct } from "../rng";

type HistoryEntry = { positionPressed: number; labelPressed: number };
type SequenceVars = {
  physicalLabels: number[];
  stageDisplays: number[];
  currentStage: number;
  history: HistoryEntry[];
};

/** Info1_Baseline, stage 1: display digit → position to press (1 = leftmost). */
const STAGE_ONE_POSITION: Record<number, number> = { 1: 2, 2: 3, 3: 4, 4: 1 };

export function positionOfLabel(vars: SequenceVars, label: number): number {
  return vars.physicalLabels.indexOf(label) + 1;
}

/**
 * The single source of truth for which physical position is correct on the current
 * stage. Stages 1-2 are Info1, stages 3-4 are Info2 — the informants read these rules,
 * the owner only sees the digits and the buttons.
 */
export function targetPosition(vars: SequenceVars): number {
  const { currentStage, history } = vars;
  const first = history[0];
  const second = history[1];
  const third = history[2];
  if (currentStage === 1) return STAGE_ONE_POSITION[vars.stageDisplays[0]] ?? 1;
  if (currentStage === 2) return first ? positionOfLabel(vars, first.labelPressed) : 1;
  if (currentStage === 3) {
    const sum = Math.min(4, (first?.positionPressed ?? 0) + (second?.positionPressed ?? 0));
    return positionOfLabel(vars, sum);
  }
  if (currentStage === 4) return third ? positionOfLabel(vars, third.positionPressed) : 1;
  return -1;
}

export const mod04SequenceProtocol: ModuleDefinition<"MOD_04_SEQUENCE_PROTOCOL"> = {
  id: "MOD_04_SEQUENCE_PROTOCOL",
  name: "Sequence Protocol",
  kind: "Memory Component",
  generate: (rng) => ({
    physicalLabels: pickDistinct(rng, [1, 2, 3, 4], 4),
    stageDisplays: [rng.int(4) + 1, rng.int(4) + 1, rng.int(4) + 1, rng.int(4) + 1],
    currentStage: 1,
    history: [],
  }),
  info1: (vars) => [
    {
      title: "Stage 1 — first press (Info 1)",
      columns: ["Displayed digit", "Press this position"],
      rows: [1, 2, 3, 4].map((digit) => ({
        cells: [String(digit), String(STAGE_ONE_POSITION[digit])],
        highlight: vars.currentStage === 1 && vars.stageDisplays[0] === digit,
      })),
      note: "Position 1 is the leftmost button. Positions are not labels.",
    },
    {
      title: "Stage 2",
      columns: ["Rule"],
      rows: [{ cells: ["Press the position whose LABEL is the same as the label pressed in stage 1."], highlight: vars.currentStage === 2 }],
    },
  ],
  info2: (vars) => [
    {
      title: "Stage 3 (Info 2)",
      columns: ["Rule"],
      rows: [
        {
          cells: ["Add the stage-1 position number to the stage-2 position number. Press the position whose LABEL equals that sum; if the sum is more than 4, press the position labelled 4."],
          highlight: vars.currentStage === 3,
        },
      ],
    },
    {
      title: "Stage 4",
      columns: ["Rule"],
      rows: [{ cells: ["Press the position whose LABEL is the stage-3 position number."], highlight: vars.currentStage === 4 }],
    },
  ],
  verify: (vars, answer) => vars.currentStage >= 1 && vars.currentStage <= 4 && answer.position === targetPosition(vars),
  advance: (vars, answer) => {
    if (answer.position !== targetPosition(vars)) return null;
    const labelPressed = vars.physicalLabels[answer.position - 1];
    return {
      ...vars,
      currentStage: vars.currentStage + 1,
      history: [...vars.history, { positionPressed: answer.position, labelPressed }],
    };
  },
  reset: (vars) => ({ ...vars, currentStage: 1, history: [] }),
  status: (vars) => `Stage ${Math.min(vars.currentStage, 4)} of 4 · display shows ${vars.stageDisplays[Math.min(vars.currentStage, 4) - 1]}`,
};
