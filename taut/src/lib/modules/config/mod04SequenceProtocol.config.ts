import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Sequence Protocol module (MOD_04).
 *
 * The stage count, the label set and the human-readable rules for every stage live here.
 * `mod04SequenceProtocol.ts` only interprets these rules, so tuning which buttons exist or
 * how many stages run never touches behaviour code.
 */

/** Labels printed on the four buttons. */
export const LABELS: readonly number[] = [1, 2, 3, 4];

/** How many stages the module runs. */
export const STAGE_COUNT = 4;

/**
 * A stage rule. `display` is the digit shown for that row; `action` is the abstract
 * instruction the implementation resolves against the current state.
 */
export type StageAction =
  | { kind: "fixedPosition"; position: number }
  | { kind: "positionOfLabel"; label: number }
  | { kind: "samePositionAsStage"; stage: number }
  | { kind: "sameLabelAsStage"; stage: number };

export interface StageRule {
  /** Digit shown on the module display for this row. */
  display: number;
  /** Human-readable sentence shown to the informant. */
  text: string;
  /** The resolved instruction. */
  action: StageAction;
}

/**
 * Rules per stage (stage 1..STAGE_COUNT). Stages 1-2 are on Info 1, stages 3-4 on Info 2
 * — that split is presentation-only and is derived in the implementation.
 */
export const STAGE_RULES: Record<number, readonly StageRule[]> = {
  1: [
    { display: 1, text: "Press the button in the 2nd position.", action: { kind: "fixedPosition", position: 2 } },
    { display: 2, text: "Press the button in the 2nd position.", action: { kind: "fixedPosition", position: 2 } },
    { display: 3, text: "Press the button in the 3rd position.", action: { kind: "fixedPosition", position: 3 } },
    { display: 4, text: "Press the button in the 4th position.", action: { kind: "fixedPosition", position: 4 } },
  ],
  2: [
    { display: 1, text: 'Press the button labeled "4".', action: { kind: "positionOfLabel", label: 4 } },
    { display: 2, text: "Press the button in the same position as stage 1.", action: { kind: "samePositionAsStage", stage: 1 } },
    { display: 3, text: "Press the button in the 1st position.", action: { kind: "fixedPosition", position: 1 } },
    { display: 4, text: "Press the button in the same position as stage 1.", action: { kind: "samePositionAsStage", stage: 1 } },
  ],
  3: [
    { display: 1, text: "Press the button with the same LABEL as the stage-2 press.", action: { kind: "sameLabelAsStage", stage: 2 } },
    { display: 2, text: "Press the button with the same LABEL as the stage-1 press.", action: { kind: "sameLabelAsStage", stage: 1 } },
    { display: 3, text: "Press the button in the 3rd position.", action: { kind: "fixedPosition", position: 3 } },
    { display: 4, text: 'Press the button labeled "4".', action: { kind: "positionOfLabel", label: 4 } },
  ],
  4: [
    { display: 1, text: "Press the button in the same position as stage 1.", action: { kind: "samePositionAsStage", stage: 1 } },
    { display: 2, text: "Press the button in the 1st position.", action: { kind: "fixedPosition", position: 1 } },
    { display: 3, text: "Press the button in the same position as stage 2.", action: { kind: "samePositionAsStage", stage: 2 } },
    { display: 4, text: "Press the button in the same position as stage 2.", action: { kind: "samePositionAsStage", stage: 2 } },
  ],
};

export const mod04SequenceProtocolConfig: ModuleConfig<"MOD_04_SEQUENCE_PROTOCOL"> = {
  id: "MOD_04_SEQUENCE_PROTOCOL",
  name: "Sequence Protocol",
  kind: "Memory Component",
  rules: {
    labels: LABELS,
    stageCount: STAGE_COUNT,
    stageRules: STAGE_RULES,
    infoNotes: {
      info1:
        "Positions are counted left to right (position 1 is the leftmost button). Labels are reshuffled every stage.",
      info2Intro:
        "You may need the buttons pressed in earlier stages — ask the other informant.",
    },
  },
};
