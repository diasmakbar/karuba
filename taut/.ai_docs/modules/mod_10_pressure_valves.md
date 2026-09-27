# [MODULE SPEC: MOD_10_PRESSURE_VALVES]
Type: Math Component
Dependencies: BaseModuleWrapper

[STATE_DEFINITION]
LocalVars:
  currentPressure: number (e.g., 40)
  serialNumber: string (3 digits)
  valvesActive: { A: boolean, B: boolean, C: boolean, D: boolean }

[EXTERNAL_INFO_MAPPING]
Info1_Baseline (Target Pressure):
  if endsWithEven(serialNumber) -> 75
  if endsWithOdd(serialNumber) -> 90

Info2_Modifier (Flow Rates):
  A -> +10, B -> +25, C -> +15, D -> -5

[VALIDATION_LOGIC]
TargetState: Combination of Info2_Modifier values that equals (Info1_Baseline - currentPressure).
OnSubmit(valvesActive):
  calculatedPressure = currentPressure + sum(activeValvesFlow)
  if calculatedPressure == Info1_Baseline -> return SUCCESS
  else -> return STRIKE

[UI_REQUIREMENTS]
- Render starting pressure display.
- Render Serial Number.
- Render 4 toggleable valves (A, B, C, D).
- Render Submit button.