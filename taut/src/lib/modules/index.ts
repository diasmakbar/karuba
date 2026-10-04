import type { AnyModuleState, LocalVarsMap, ModuleAnswerMap, ModuleId, ModuleState } from "../../types/db-schema";
import type { AnyModuleDefinition, AnyModuleConfig, ModuleConfig, ModuleDefinition } from "./contract";
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
import { mod12Battleship } from "./mod12Battleship";
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
  MOD_12_BATTLESHIP: mod12Battleship,
  MOD_13_SHAPE_SORTER: mod13ShapeSorter,
  MOD_14_PNEUMATIC_TUBE: mod14PneumaticTube,
  MOD_15_BIOMETRIC_SCANNER: mod15BiometricScanner,
};

export const ALL_MODULE_IDS: ModuleId[] = Object.keys(MODULE_REGISTRY) as ModuleId[];

/**
 * Every module's configuration, keyed by id. Derived from the definitions so a module's config
 * is always the single source of truth. Tweak difficulty / rules here (or in the module's
 * `config/*.config.ts` file) without touching executable logic.
 */
export const MODULE_CONFIG_REGISTRY: { [K in ModuleId]: ModuleConfig<K> } = Object.fromEntries(
  (Object.keys(MODULE_REGISTRY) as ModuleId[]).map((id) => [id, MODULE_REGISTRY[id].config]),
) as { [K in ModuleId]: ModuleConfig<K> };

/** Type-erased config lookup for tooling / admin panels. */
export function configById(id: ModuleId): AnyModuleConfig {
  return MODULE_CONFIG_REGISTRY[id];
}

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

export type { AnyModuleDefinition, AnyModuleConfig };

// Re-export every per-module config so a module's tunables are reachable from one import site.
export { mod01WireConfig } from "./config/mod01Wire.config";
export { mod02InvisibleMazeConfig } from "./config/mod02InvisibleMaze.config";
export { mod03ButtonConfig } from "./config/mod03Button.config";
export { mod04SequenceProtocolConfig } from "./config/mod04SequenceProtocol.config";
export { mod05ChemistryConfig } from "./config/mod05Chemistry.config";
export { mod06PowerGridConfig } from "./config/mod06PowerGrid.config";
export { mod07EqualizerConfig } from "./config/mod07Equalizer.config";
export { mod08RadarConfig } from "./config/mod08Radar.config";
export { mod09SynthesizerConfig } from "./config/mod09Synthesizer.config";
export { mod10PressureValvesConfig } from "./config/mod10PressureValves.config";
export { mod11IntercomConfig } from "./config/mod11Intercom.config";
export { mod12BattleshipConfig } from "./config/mod12Battleship.config";
export { mod13ShapeSorterConfig } from "./config/mod13ShapeSorter.config";
export { mod14PneumaticTubeConfig } from "./config/mod14PneumaticTube.config";
export { mod15BiometricScannerConfig } from "./config/mod15BiometricScanner.config";
