import type { LocalVarsMap, ModuleAnswerMap, ModuleId } from "../../types/db-schema";
import type { Rng } from "../rng";

/**
 * One highlighted entry of a manual page. `highlight` marks the row that applies
 * to the module instance the informant is reading for — informants read tables,
 * they never do arithmetic, and the owner never sees these tables at all.
 */
export interface InfoRow {
  cells: readonly string[];
  highlight: boolean;
}

export interface InfoTable {
  title: string;
  columns: readonly string[];
  rows: readonly InfoRow[];
  note?: string;
}

export type InfoPayload = readonly InfoTable[];

/**
 * A module is a pure contract: the host generates state, two info pages describe
 * how to read that state, and `verify` decides success vs strike. No module touches
 * Firebase — see utils/game.ts for the write side.
 */
export interface ModuleDefinition<K extends ModuleId> {
  id: K;
  name: string;
  kind: string;
  /** Host-only: roll the hardware state for one instance. */
  generate: (rng: Rng) => LocalVarsMap[K];
  /** Page held by `informant1Id`. */
  info1: (vars: LocalVarsMap[K]) => InfoPayload;
  /** Page held by `informant2Id`. */
  info2: (vars: LocalVarsMap[K]) => InfoPayload;
  /** Pure strike/success check against the submitted answer. */
  verify: (vars: LocalVarsMap[K], answer: ModuleAnswerMap[K]) => boolean;
  /** Optional line shown to the owner (progress, current coordinate, ...). */
  status?: (vars: LocalVarsMap[K]) => string;
  /**
   * Optional host-side state update for multi-step modules (maze, sequence, button).
   * Returns the new vars, or null when the step was a strike (state stays untouched).
   */
  advance?: (vars: LocalVarsMap[K], answer: ModuleAnswerMap[K]) => LocalVarsMap[K] | null;
  /** Optional: multi-step modules that restart from stage 1 after a strike. */
  reset?: (vars: LocalVarsMap[K]) => LocalVarsMap[K];
}

export type AnyModuleDefinition = { [K in ModuleId]: ModuleDefinition<K> }[ModuleId];

/* ------------------------------------------------------------------ *
 * Type-erased runners
 * ------------------------------------------------------------------ */

/**
 * A module record read from Firebase always pairs `moduleId` with the matching
 * `localVars`, because the pair is created together by `generate` in utils/room.ts.
 * TypeScript still cannot *call* a union of function types, so these three runners are
 * the single place where the strict pairing is loosened — everything else stays exact.
 */
export function runVerify(
  definition: AnyModuleDefinition,
  vars: LocalVarsMap[ModuleId],
  answer: ModuleAnswerMap[ModuleId],
): boolean {
  return (definition.verify as (v: LocalVarsMap[ModuleId], a: ModuleAnswerMap[ModuleId]) => boolean)(vars, answer);
}

export function runAdvance(
  definition: AnyModuleDefinition,
  vars: LocalVarsMap[ModuleId],
  answer: ModuleAnswerMap[ModuleId],
): LocalVarsMap[ModuleId] | null {
  if (!definition.advance) return null;
  return (definition.advance as (v: LocalVarsMap[ModuleId], a: ModuleAnswerMap[ModuleId]) => LocalVarsMap[ModuleId] | null)(
    vars,
    answer,
  );
}

export function runReset(definition: AnyModuleDefinition, vars: LocalVarsMap[ModuleId]): LocalVarsMap[ModuleId] {
  if (!definition.reset) return vars;
  return (definition.reset as (v: LocalVarsMap[ModuleId]) => LocalVarsMap[ModuleId])(vars);
}

export function runStatus(definition: AnyModuleDefinition, vars: LocalVarsMap[ModuleId]): string | null {
  if (!definition.status) return null;
  return (definition.status as (v: LocalVarsMap[ModuleId]) => string)(vars);
}

export function runInfo(
  page: "info1" | "info2",
  definition: AnyModuleDefinition,
  vars: LocalVarsMap[ModuleId],
): InfoPayload {
  const page_fn = page === "info1" ? definition.info1 : definition.info2;
  return (page_fn as (v: LocalVarsMap[ModuleId]) => InfoPayload)(vars);
}
