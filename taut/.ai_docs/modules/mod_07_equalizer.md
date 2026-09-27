# [MODULE SPEC: MOD_07_EQUALIZER]
Type: Math Component
Dependencies: BaseModuleWrapper

[STATE_DEFINITION]
LocalVars:
  serialNumber: string (3 digits)
  hardwareRevision: "Rev 1.0" | "Rev 1.2" | "Rev 1.4"
  sliders: { bass: number, mid: number, treble: number } (range 1-5)

[EXTERNAL_INFO_MAPPING]
Info1_Baseline (Target Profile):
  if endsWithEven(serialNumber) -> Bass 4, Mid 2, Treble 5
  if endsWithOdd(serialNumber) -> Bass 1, Mid 5, Treble 3

Info2_Modifier (Hardware Bugs):
  Rev 1.0 -> No change
  Rev 1.2 -> Mid outputs +2 physical value
  Rev 1.4 -> Bass outputs inverted (6 - physical value)

[VALIDATION_LOGIC]
TargetState: Calculate required physical slider position to meet Info1_Baseline given Info2_Modifier constraints.
OnSubmit(sliders):
  if sliders == TargetState -> return SUCCESS
  else -> return STRIKE

[UI_REQUIREMENTS]
- Render 3 vertical sliders (Bass, Mid, Treble) snapping to values 1-5.
- Render Serial Number and Revision Number.
- Render Submit button.