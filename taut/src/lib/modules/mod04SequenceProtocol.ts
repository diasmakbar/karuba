import type { Rng } from "../rng";
import type { ModuleDefinition } from "./contract";
import { pickDistinct } from "../rng";

type HistoryEntry = { positionPressed: number; labelPressed: number };
type SequenceVars = {
  /** Button labels as they appear left→right for the CURRENT stage, i.e. labels[0] is position 1. */
  physicalLabels: number[];
  /** The digit shown for each of the 4 stages. */
  stageDisplays: number[];
  currentStage: number;
  history: HistoryEntry[];
  /** Advances each stage; used to reshuffle the labels deterministically. */
  labelSeed: number;
};

/**
 * Firebase RTDB drops empty arrays, so `history: []` reads back as `undefined`. Normalise before
 * reading so the first press (empty history) never crashes.
 */
function historyOf(vars: SequenceVars): HistoryEntry[] {
  return Array.isArray(vars.history) ? vars.history : [];
}

/** Labels for the current stage, defaulting to a fresh 1-4 order if Firebase dropped them. */
function labelsOf(vars: SequenceVars): number[] {
  return Array.isArray(vars.physicalLabels) && vars.physicalLabels.length === 4
    ? vars.physicalLabels
    : [1, 2, 3, 4];
}

/** Deterministic shuffle for a given seed — no external RNG needed inside the pure `advance`. */
function shuffleForSeed(seed: number): number[] {
  const rng: Rng = {
    int: (maxExclusive: number) => {
      // Simple xorshift-ish generator; only needs to look random to the player.
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed % maxExclusive;
    },
    pick: <T>(items: readonly T[]) => items[(seed * 48271) % items.length],
    bool: () => ((seed * 48271) & 1) === 1,
    shuffle: <T>(items: readonly T[]) => {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        const j = seed % (i + 1);
        const swap = copy[i];
        copy[i] = copy[j];
        copy[j] = swap;
      }
      return copy;
    },
  };
  return rng.shuffle([1, 2, 3, 4]);
}

/** 1-based left→right position that holds the given label on the current stage. */
export function positionOfLabel(vars: SequenceVars, label: number): number {
  return labelsOf(vars).indexOf(label) + 1;
}

/** The label printed on the button at a 1-based position this stage. */
function labelAtPosition(vars: SequenceVars, position: number): number {
  return labelsOf(vars)[position - 1];
}

/**
 * The authoritative target for the current stage, per the module gameplan.
 * Stage 1-2 rules live on Info 1; stage 3-4 rules live on Info 2.
 */
export function targetPosition(vars: SequenceVars): number {
  const stage = vars.currentStage;
  const display = vars.stageDisplays[stage - 1];
  const history = historyOf(vars);
  const s1 = history[0];
  const s2 = history[1];

  if (stage === 1) {
    switch (display) {
      case 1:
      case 2:
        return 2;
      case 3:
        return 3;
      case 4:
        return 4;
      default:
        return -1;
    }
  }

  if (stage === 2) {
    switch (display) {
      case 1:
        return positionOfLabel(vars, 4);
      case 2:
        return s1 ? s1.positionPressed : 1;
      case 3:
        return 1;
      case 4:
        return s1 ? s1.positionPressed : 1;
      default:
        return -1;
    }
  }

  if (stage === 3) {
    switch (display) {
      case 1:
        return s2 ? positionOfLabel(vars, s2.labelPressed) : 1;
      case 2:
        return s1 ? positionOfLabel(vars, s1.labelPressed) : 1;
      case 3:
        return 3;
      case 4:
        return positionOfLabel(vars, 4);
      default:
        return -1;
    }
  }

  if (stage === 4) {
    switch (display) {
      case 1:
        return s1 ? s1.positionPressed : 1;
      case 2:
        return 1;
      case 3:
        return s2 ? s2.positionPressed : 1;
      case 4:
        return s2 ? s2.positionPressed : 1;
      default:
        return -1;
    }
  }

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
    labelSeed: rng.int(100000) + 1,
  }),
  info1: () => [
    {
      title: "Stage 1 (Info 1)",
      columns: ["Display", "Press"],
      rows: [1, 2, 3, 4].map((digit) => ({
        cells: [`${digit}`, stageOneRule(digit)],
        highlight: false,
      })),
      note: "Positions are counted left to right (position 1 is the leftmost button). Labels are reshuffled every stage.",
    },
    {
      title: "Stage 2 (Info 1)",
      columns: ["Display", "Press"],
      rows: [1, 2, 3, 4].map((digit) => ({
        cells: [`${digit}`, stageTwoRule(digit)],
        highlight: false,
      })),
      note: "Read out the rule for the digit the owner shows you.",
    },
  ],
  info2: () => [
    {
      title: "Stage 3 (Info 2)",
      columns: ["Display", "Press"],
      rows: [1, 2, 3, 4].map((digit) => ({
        cells: [`${digit}`, stageThreeRule(digit)],
        highlight: false,
      })),
      note: "You may need the buttons pressed in stages 1 and 2 — ask the other informant.",
    },
    {
      title: "Stage 4 (Info 2)",
      columns: ["Display", "Press"],
      rows: [1, 2, 3, 4].map((digit) => ({
        cells: [`${digit}`, stageFourRule(digit)],
        highlight: false,
      })),
      note: "You may need the buttons pressed earlier — coordinate with the other informant.",
    },
  ],
  verify: (vars, answer) => {
    const stage = vars.currentStage;
    if (stage < 1 || stage > 4) return stage >= 5;
    return answer.position === targetPosition(vars);
  },
  advance: (vars, answer) => {
    if (answer.position !== targetPosition(vars)) return null;
    const labelPressed = labelAtPosition(vars, answer.position);
    const history = historyOf(vars);
    const nextStage = vars.currentStage + 1;
    // Final stage: return null so the module is marked solved (runAdvance: null = finished).
    if (nextStage > 4) return null;
    const nextSeed = (vars.labelSeed ?? 1) + 1;
    return {
      ...vars,
      currentStage: nextStage,
      history: [...history, { positionPressed: answer.position, labelPressed }],
      // Reshuffle labels for the new stage.
      physicalLabels: shuffleForSeed(nextSeed),
      labelSeed: nextSeed,
    };
  },
  reset: (vars) => ({ ...vars, currentStage: 1, history: [] }),
  status: (vars) =>
    `Stage ${Math.min(vars.currentStage, 4)} of 4 · display shows ${vars.stageDisplays[Math.min(vars.currentStage, 4) - 1]}`,
};

/* ------------------------------------------------------------------ *
 * Human-readable rules (informant-facing).
 * ------------------------------------------------------------------ */

function stageOneRule(digit: number): string {
  switch (digit) {
    case 1:
    case 2:
      return "Press the button in the 2nd position.";
    case 3:
      return "Press the button in the 3rd position.";
    case 4:
      return "Press the button in the 4th position.";
    default:
      return "—";
  }
}

function stageTwoRule(digit: number): string {
  switch (digit) {
    case 1:
      return 'Press the button labeled "4".';
    case 2:
      return "Press the button in the same position as stage 1.";
    case 3:
      return "Press the button in the 1st position.";
    case 4:
      return "Press the button in the same position as stage 1.";
    default:
      return "—";
  }
}

function stageThreeRule(digit: number): string {
  switch (digit) {
    case 1:
      return "Press the button with the same LABEL as the stage-2 press.";
    case 2:
      return "Press the button with the same LABEL as the stage-1 press.";
    case 3:
      return "Press the button in the 3rd position.";
    case 4:
      return 'Press the button labeled "4".';
    default:
      return "—";
  }
}

function stageFourRule(digit: number): string {
  switch (digit) {
    case 1:
      return "Press the button in the same position as stage 1.";
    case 2:
      return "Press the button in the 1st position.";
    case 3:
      return "Press the button in the same position as stage 2.";
    case 4:
      return "Press the button in the same position as stage 2.";
    default:
      return "—";
  }
}
