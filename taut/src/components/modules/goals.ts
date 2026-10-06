import type { ModuleId } from "../../types/db-schema";

/**
 * One-line beginner hints: shown to the owner only in BEGINNER rooms so first-time players know
 * what the module is asking for. Standard/Extreme hide these to keep the puzzle clean.
 * Derived from each module definition's `status()` text.
 */
export const MODULE_GOALS: Record<ModuleId, string> = {
  MOD_01_WIRE: "Cut the one correct wire. Ask your informants for its colour, then the cutting manual.",
  MOD_02_INVISIBLE_MAZE: "Walk the token to the exit using the arrow pad. Informants describe the hidden walls and rotation.",
  MOD_03_BUTTON: "Press or hold the button exactly as the two manual pages describe.",
  MOD_04_SEQUENCE_PROTOCOL: "Press the correct position each stage. Stages 1–2 use Info 1, stages 3–4 use Info 2.",
  MOD_05_CHEMISTRY: "Press the two vials that mix into the antidote named on your manuals.",
  MOD_06_POWER_GRID: "Set the switches to the pattern your manuals describe, then execute.",
  MOD_07_EQUALIZER: "Set the sliders so the output screen matches the target profile from your manuals.",
  MOD_08_RADAR: "Find the storm: start at the epicentre, apply the wind drift, then tap that cell.",
  MOD_09_SYNTHESIZER: "Press the vial that matches the synthesizer target, per your manuals.",
  MOD_10_PRESSURE_VALVES: "Open the valves that bring the gauge to the target pressure from your manuals.",
  MOD_11_INTERCOM: "Follow the meaning chain through your manuals and press the final message.",
  MOD_12_BATTLESHIP: "Select the single coordinate where the target ship and the incoming shot cross.",
  MOD_13_SHAPE_SORTER: "Tap the one object that passes both filters described on your manuals.",
  MOD_14_PNEUMATIC_TUBE: "Load the capsule into the correct tube for the document code.",
  MOD_15_BIOMETRIC_SCANNER: "Approve or reject the scan based on the two clearance numbers read to you.",
};
