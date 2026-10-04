import type { Rng } from "../rng";
import type { ModuleDefinition } from "./contract";
import { pickDistinct } from "../rng";
import {
  LABELS,
  STAGE_COUNT,
  STAGE_RULES,
  mod04SequenceProtocolConfig,
  type StageAction,
} from "./config/mod04SequenceProtocol.config";

type HistoryEntry = { positionPressed: number; labelPressed: number };
type SequenceVars = {
  /** Button labels as they appear left→right for the CURRENT stage, i.e. labels[0] is position 1. */
  physicalLabels: number[];
  /** The digit shown for each of the stages. */
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

/** Labels for the current stage, defaulting to a fresh order if Firebase dropped them. */
function labelsOf(vars: SequenceVars): number[] {
  return Array.isArray(vars.physicalLabels) && vars.physicalLabels.length === LABELS.length
    ? vars.physicalLabels
    : [...LABELS];
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
  return rng.shuffle([...LABELS]);
}

/** 1-based left→right position that holds the given label on the current stage. */
export function positionOfLabel(vars: SequenceVars, label: number): number {
  return labelsOf(vars).indexOf(label) + 1;
}

/** The label printed on the button at a 1-based position this stage. */
function labelAtPosition(vars: SequenceVars, position: number): number {
  return labelsOf(vars)[position - 1];
}

/** Resolve a config stage action to a concrete 1-based target position for the current vars. */
function resolveAction(vars: SequenceVars, action: StageAction): number {
  const history = historyOf(vars);
  switch (action.kind) {
    case "fixedPosition":
      return action.position;
    case "positionOfLabel":
      return positionOfLabel(vars, action.label);
    case "samePositionAsStage":
      return history[action.stage - 1]?.positionPressed ?? 1;
    case "sameLabelAsStage":
      return history[action.stage - 1]
        ? positionOfLabel(vars, history[action.stage - 1].labelPressed)
        : 1;
  }
}

/** The rule rows (all displays) for a given stage, straight from config. */
export function stageRules(stage: number): readonly { display: number; text: string }[] {
  return STAGE_RULES[stage] ?? [];
}

/** Build one Info table for a stage from the config ruleset. */
function stageTable(title: string, stage: number, note: string) {
  return {
    title,
    columns: ["Display", "Press"],
    rows: stageRules(stage).map((item) => ({
      cells: [String(item.display), item.text],
      highlight: false,
    })),
    note,
  };
}

/**
 * The authoritative target for the current stage, per the config ruleset.
 * Stages 1-2 rules live on Info 1; stage 3-4 rules live on Info 2 (split is presentation-only).
 */
export function targetPosition(vars: SequenceVars): number {
  const stage = vars.currentStage;
  const display = vars.stageDisplays[stage - 1];
  if (stage < 1 || stage > STAGE_COUNT) return -1;
  const rule = STAGE_RULES[stage]?.find((item) => item.display === display);
  if (!rule) return -1;
  return resolveAction(vars, rule.action);
}

export const mod04SequenceProtocol: ModuleDefinition<"MOD_04_SEQUENCE_PROTOCOL"> = {
  config: mod04SequenceProtocolConfig,
  id: mod04SequenceProtocolConfig.id,
  name: mod04SequenceProtocolConfig.name,
  kind: mod04SequenceProtocolConfig.kind,
  generate: (rng) => ({
    physicalLabels: pickDistinct(rng, LABELS, LABELS.length),
    stageDisplays: Array.from({ length: STAGE_COUNT }, () => rng.int(4) + 1),
    currentStage: 1,
    history: [],
    labelSeed: rng.int(100000) + 1,
  }),
  info1: () => [
    stageTable(`Stage 1 (Info 1)`, 1, "Positions are counted left to right (position 1 is the leftmost button). Labels are reshuffled every stage."),
    stageTable(`Stage 2 (Info 1)`, 2, "Read out the rule for the digit the owner shows you."),
  ],
  info2: () => [
    stageTable(`Stage 3 (Info 2)`, 3, "You may need the buttons pressed in stages 1 and 2 — ask the other informant."),
    stageTable(`Stage 4 (Info 2)`, 4, "You may need the buttons pressed earlier — coordinate with the other informant."),
  ],
  verify: (vars, answer) => {
    const stage = vars.currentStage;
    if (stage < 1 || stage > STAGE_COUNT) return stage > STAGE_COUNT;
    return answer.position === targetPosition(vars);
  },
  advance: (vars, answer) => {
    if (answer.position !== targetPosition(vars)) return null;
    const labelPressed = labelAtPosition(vars, answer.position);
    const history = historyOf(vars);
    const nextStage = vars.currentStage + 1;
    // Final stage: return null so the module is marked solved (runAdvance: null = finished).
    if (nextStage > STAGE_COUNT) return null;
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
    `Stage ${Math.min(vars.currentStage, STAGE_COUNT)} of ${STAGE_COUNT} · display shows ${vars.stageDisplays[Math.min(vars.currentStage, STAGE_COUNT) - 1]}`,
};
