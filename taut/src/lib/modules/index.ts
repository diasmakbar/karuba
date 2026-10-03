import type { AnyModuleState, LocalVarsMap, ModuleAnswerMap, ModuleId, ModuleState } from "../../types/db-schema";
import type { AnyModuleDefinition, ModuleDefinition } from "./contract";
import { mod01Wire } from "./mod01Wire";
import { mod02InvisibleMaze } from "./mod02InvisibleMaze";
import { mod03Button } from "./mod03Button";
import { mod04SequenceProtocol } from "./mod04SequenceProtocol";
import { mod05Chemistry } from "./mod05Chemistry";
import { mod06PowerGrid } from "./mod06PowerGrid";
import { mod07Equalizer } from "./mod07Equalizer";
import { mod08Radar } from "./mod08Radar";
import { mod09Synthesizer } from "./mod09Synthesizer";
import { mod10PressureValves } from "./mod10PressureValves";
import { mod11Intercom } from "./mod11Intercom";
import { mod12SafeZone } from "./mod12SafeZone";
import { mod13ShapeSorter } from "./mod13ShapeSorter";
import { mod14PneumaticTube } from "./mod14PneumaticTube";
import { mod15BiometricScanner } from "./mod15BiometricScanner";

/** Every module, keyed by the ids used in .ai_docs/modules. */
export const MODULE_REGISTRY: { [K in ModuleId]: ModuleDefinition<K> } = {
  MOD_01_WIRE: mod01Wire,
  MOD_02_INVISIBLE_MAZE: mod02InvisibleMaze,
  MOD_03_BUTTON: mod03Button,
  MOD_04_SEQUENCE_PROTOCOL: mod04SequenceProtocol,
  MOD_05_CHEMISTRY: mod05Chemistry,
  MOD_06_POWER_GRID: mod06PowerGrid,
  MOD_07_EQUALIZER: mod07Equalizer,
  MOD_08_RADAR: mod08Radar,
  MOD_09_SYNTHESIZER: mod09Synthesizer,
  MOD_10_PRESSURE_VALVES: mod10PressureValves,
  MOD_11_INTERCOM: mod11Intercom,
  MOD_12_SAFE_ZONE: mod12SafeZone,
  MOD_13_SHAPE_SORTER: mod13ShapeSorter,
  MOD_14_PNEUMATIC_TUBE: mod14PneumaticTube,
  MOD_15_BIOMETRIC_SCANNER: mod15BiometricScanner,
};

export const ALL_MODULE_IDS: ModuleId[] = Object.keys(MODULE_REGISTRY) as ModuleId[];

export function definitionFor<K extends ModuleId>(id: K): ModuleDefinition<K> {
  return MODULE_REGISTRY[id];
}

/** Type-erased lookup for rendering / info panels driven by DB data. */
export function definitionById(id: ModuleId): AnyModuleDefinition {
  return MODULE_REGISTRY[id];
}

export function verifyModuleState<K extends ModuleId>(state: ModuleState<K>, answer: ModuleAnswerMap[K]): boolean {
  return definitionFor(state.moduleId).verify(state.localVars, answer);
}

/** Narrow a module record coming out of Firebase to the concrete module type. */
export function narrowModuleState<K extends ModuleId>(
  state: AnyModuleState,
  // The id is used only to bind K at the call site; it carries no runtime meaning.
  id: K,
): ModuleState<K> & { localVars: LocalVarsMap[K] } {
  void id;
  return state as unknown as ModuleState<K> & { localVars: LocalVarsMap[K] };
}

export type { AnyModuleDefinition };
