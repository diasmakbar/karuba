import type { ModuleConfig } from "../contract";

/**
 * Configuration for the Wire Cutters module (MOD_01).
 *
 * All tunable data lives here. To change the palette, the pin range, the serial
 * format or the cutting rules, edit this file only — `mod01Wire.ts` is pure behaviour.
 * A rule's `target` describes which wire (0-based) to cut when it matches; the `code`
 * values are resolved by the implementation so the ruleset stays serialisable data.
 */

/** Every wire colour is drawn from this pool, regardless of wire count. */
export const WIRE_COLORS = ["Red", "White", "Blue", "Yellow", "Black"] as const;
export type WireColor = (typeof WIRE_COLORS)[number];

/** Left pins A1..A6 and right pins B1..B6. */
export const PIN_POOL = [1, 2, 3, 4, 5, 6] as const;

/** Wire counts the module can deal, and how likely (uniform) each is. */
export const WIRE_COUNT_OPTIONS = [3, 4, 5, 6] as const;
export type WireCount = (typeof WIRE_COUNT_OPTIONS)[number];

export type WireRuleTarget =
  | { kind: "index"; index: number }
  | { kind: "last" }
  | { kind: "lastOfColor"; color: WireColor };

/** A single condition in the cutting manual; conditions are ANDed. */
export type WireRuleCondition =
  | { kind: "countColor"; color: WireColor; op: "eq" | "gt"; value: number }
  | { kind: "lastIs"; color: WireColor }
  | { kind: "serialOdd" };

export interface WireRule {
  /** Sentence shown in Info 2's manual. */
  text: string;
  /** All conditions must hold for the rule to match. */
  conditions: WireRuleCondition[];
  /** Which wire to cut when the rule matches. */
  target: WireRuleTarget;
}

/** Info2_Manual: cutting rules per wire count. Evaluated in order; first match wins. */
export const WIRE_RULES: Record<WireCount, readonly WireRule[]> = {
  3: [
    {
      text: "If there are no red wires, cut the second wire.",
      conditions: [{ kind: "countColor", color: "Red", op: "eq", value: 0 }],
      target: { kind: "index", index: 1 },
    },
    {
      text: "Otherwise, if the last wire is white, cut the last wire.",
      conditions: [{ kind: "lastIs", color: "White" }],
      target: { kind: "last" },
    },
    {
      text: "Otherwise, if there is more than one blue wire, cut the last blue wire.",
      conditions: [{ kind: "countColor", color: "Blue", op: "gt", value: 1 }],
      target: { kind: "lastOfColor", color: "Blue" },
    },
    {
      text: "Otherwise, cut the last wire.",
      conditions: [],
      target: { kind: "last" },
    },
  ],
  4: [
    {
      text: "If there is more than one red wire and the last digit of the serial number is odd, cut the last red wire.",
      conditions: [
        { kind: "countColor", color: "Red", op: "gt", value: 1 },
        { kind: "serialOdd" },
      ],
      target: { kind: "lastOfColor", color: "Red" },
    },
    {
      text: "Otherwise, if the last wire is yellow and there are no red wires, cut the first wire.",
      conditions: [
        { kind: "lastIs", color: "Yellow" },
        { kind: "countColor", color: "Red", op: "eq", value: 0 },
      ],
      target: { kind: "index", index: 0 },
    },
    {
      text: "Otherwise, if there is exactly one blue wire, cut the first wire.",
      conditions: [{ kind: "countColor", color: "Blue", op: "eq", value: 1 }],
      target: { kind: "index", index: 0 },
    },
    {
      text: "Otherwise, if there is more than one yellow wire, cut the last wire.",
      conditions: [{ kind: "countColor", color: "Yellow", op: "gt", value: 1 }],
      target: { kind: "last" },
    },
    {
      text: "Otherwise, cut the second wire.",
      conditions: [],
      target: { kind: "index", index: 1 },
    },
  ],
  5: [
    {
      text: "If the last wire is black and the last digit of the serial number is odd, cut the fourth wire.",
      conditions: [
        { kind: "lastIs", color: "Black" },
        { kind: "serialOdd" },
      ],
      target: { kind: "index", index: 3 },
    },
    {
      text: "Otherwise, if there is exactly one red wire and there is more than one yellow wire, cut the first wire.",
      conditions: [
        { kind: "countColor", color: "Red", op: "eq", value: 1 },
        { kind: "countColor", color: "Yellow", op: "gt", value: 1 },
      ],
      target: { kind: "index", index: 0 },
    },
    {
      text: "Otherwise, if there are no black wires, cut the second wire.",
      conditions: [{ kind: "countColor", color: "Black", op: "eq", value: 0 }],
      target: { kind: "index", index: 1 },
    },
    {
      text: "Otherwise, cut the first wire.",
      conditions: [],
      target: { kind: "index", index: 0 },
    },
  ],
  6: [
    {
      text: "If there are no yellow wires and the last digit of the serial number is odd, cut the third wire.",
      conditions: [
        { kind: "countColor", color: "Yellow", op: "eq", value: 0 },
        { kind: "serialOdd" },
      ],
      target: { kind: "index", index: 2 },
    },
    {
      text: "Otherwise, if there is exactly one yellow wire and there is more than one white wire, cut the fourth wire.",
      conditions: [
        { kind: "countColor", color: "Yellow", op: "eq", value: 1 },
        { kind: "countColor", color: "White", op: "gt", value: 1 },
      ],
      target: { kind: "index", index: 3 },
    },
    {
      text: "Otherwise, if there are no red wires, cut the last wire.",
      conditions: [{ kind: "countColor", color: "Red", op: "eq", value: 0 }],
      target: { kind: "last" },
    },
    {
      text: "Otherwise, cut the fourth wire.",
      conditions: [],
      target: { kind: "index", index: 3 },
    },
  ],
};

/** Informant-facing note strings, typed so consumers keep autocompletion. */
export const WIRE_NOTES = {
  info1: "Wires are listed top to bottom. Read every color out loud.",
  info2:
    "Rules are checked in order; stop at the first one that matches. 'Last digit' refers to the serial number.",
} as const;

export const mod01WireConfig: ModuleConfig<"MOD_01_WIRE"> = {
  id: "MOD_01_WIRE",
  name: "Wire Cutters",
  kind: "Logic Component",
  rules: {
    wireColors: WIRE_COLORS,
    pinPool: PIN_POOL,
    wireCountOptions: WIRE_COUNT_OPTIONS,
    cuttingRules: WIRE_RULES,
    infoNotes: WIRE_NOTES,
  },
};
