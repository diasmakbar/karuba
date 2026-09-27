# [MODULE SPEC: MOD_06_POWER_GRID]
Type: Puzzle Component
Dependencies: BaseModuleWrapper, FirebaseContext

[STATE_DEFINITION]
LocalVars:
  serialNumber: string (3 digits)
  warningLight: "FLASHING" | "SOLID"
  switches: boolean[] (length 5, default all false)

[EXTERNAL_INFO_MAPPING]
Info1_Baseline (Derived from serialNumber):
  if endsWithEven(serialNumber) -> [true, false, true, false, false]
  if endsWithOdd(serialNumber) -> [false, true, false, true, true]

Info2_Modifier (Derived from warningLight):
  if "FLASHING" -> invert(index 1, index 3) // Toggle switches 2 and 4
  if "SOLID" -> invert(index 0, index 4) // Toggle switches 1 and 5

[VALIDATION_LOGIC]
TargetState: Apply(Info2_Modifier, Info1_Baseline)
OnSubmit(currentSwitches):
  if currentSwitches == TargetState -> return SUCCESS
  else -> return STRIKE

[UI_REQUIREMENTS]
- Render 5 toggle switches (no labels, just visual ON/OFF states).
- Render warning light indicator (animated flashing or solid color).
- Render serial number display.
- Render Submit/Execute button.