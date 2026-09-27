# [MODULE SPEC: MOD_05_CHEMISTRY]
Type: Association Component
Dependencies: BaseModuleWrapper

[STATE_DEFINITION]
LocalVars:
  hazardSymbol: "Biohazard" | "Radiation" | "Corrosive"
  buttonsPressed: string[] (max 2)

[EXTERNAL_INFO_MAPPING]
Info1_Baseline (Antidote):
  Biohazard -> "ORANGE"
  Radiation -> "GREEN"
  Corrosive -> "PURPLE"

Info2_Modifier (Vial Mapping):
  Triangle -> Red
  Square -> Yellow
  Hexagon -> Blue
  Circle -> Clear

[VALIDATION_LOGIC]
TargetState: ColorMixing(Info1_Baseline) -> Map to Info2_Modifier shapes.
OnSubmit(buttonsPressed):
  if mappedColors(buttonsPressed) == Info1_Baseline -> return SUCCESS
  else -> clear inputs, return STRIKE

[UI_REQUIREMENTS]
- Render hazard symbol display.
- Render 4 shape buttons (Triangle, Square, Hexagon, Circle).