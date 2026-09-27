# [MODULE SPEC: MOD_08_RADAR]
Type: Spatial Component
Dependencies: BaseModuleWrapper

[STATE_DEFINITION]
LocalVars:
  constellation: "Ursa" | "Orion" | "Draco"
  windDirection: "North" | "East" | "South"
  selectedCoord: string

[EXTERNAL_INFO_MAPPING]
Info1_Baseline (Epicenter):
  Ursa -> C3
  Orion -> A5
  Draco -> E1

Info2_Modifier (Drift Pattern):
  North -> -1 Y, -1 X
  East -> +2 X, -1 Y
  South -> +2 Y

[VALIDATION_LOGIC]
TargetState: Info1_Baseline + Info2_Modifier (clamped to 5x5 grid boundaries).
OnSubmit(selectedCoord):
  if selectedCoord == TargetState -> return SUCCESS
  else -> return STRIKE

[UI_REQUIREMENTS]
- Render 5x5 grid (A-E, 1-5).
- Render visual Constellation shape and Wind Direction arrow.