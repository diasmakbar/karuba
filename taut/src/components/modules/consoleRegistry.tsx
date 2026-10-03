import type { ComponentType } from "react";
import type { ModuleId } from "../../types/db-schema";
import type { ModuleConsoleProps } from "./types";
import { WireConsole } from "./WireConsole";
import { InvisibleMazeConsole } from "./InvisibleMazeConsole";
import { ButtonConsole } from "./ButtonConsole";
import { SequenceProtocolConsole } from "./SequenceProtocolConsole";
import { ChemistryConsole } from "./ChemistryConsole";
import { PowerGridConsole } from "./PowerGridConsole";
import { EqualizerConsole } from "./EqualizerConsole";
import { RadarConsole } from "./RadarConsole";
import { SynthesizerConsole } from "./SynthesizerConsole";
import { PressureValvesConsole } from "./PressureValvesConsole";
import { IntercomConsole } from "./IntercomConsole";
import { SafeZoneConsole } from "./SafeZoneConsole";
import { ShapeSorterConsole } from "./ShapeSorterConsole";
import { PneumaticTubeConsole } from "./PneumaticTubeConsole";
import { BiometricScannerConsole } from "./BiometricScannerConsole";

export type ConsoleComponent = ComponentType<ModuleConsoleProps>;

/** Maps each module id to its owner console. Mirrors the logic registry in lib/modules. */
export const CONSOLE_REGISTRY: Record<ModuleId, ConsoleComponent> = {
  MOD_01_WIRE: WireConsole,
  MOD_02_INVISIBLE_MAZE: InvisibleMazeConsole,
  MOD_03_BUTTON: ButtonConsole,
  MOD_04_SEQUENCE_PROTOCOL: SequenceProtocolConsole,
  MOD_05_CHEMISTRY: ChemistryConsole,
  MOD_06_POWER_GRID: PowerGridConsole,
  MOD_07_EQUALIZER: EqualizerConsole,
  MOD_08_RADAR: RadarConsole,
  MOD_09_SYNTHESIZER: SynthesizerConsole,
  MOD_10_PRESSURE_VALVES: PressureValvesConsole,
  MOD_11_INTERCOM: IntercomConsole,
  MOD_12_SAFE_ZONE: SafeZoneConsole,
  MOD_13_SHAPE_SORTER: ShapeSorterConsole,
  MOD_14_PNEUMATIC_TUBE: PneumaticTubeConsole,
  MOD_15_BIOMETRIC_SCANNER: BiometricScannerConsole,
};
