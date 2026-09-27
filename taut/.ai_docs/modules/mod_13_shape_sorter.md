# [MODULE SPEC: MOD_13_SHAPE_SORTER]
Type: Filtering Component
Dependencies: BaseModuleWrapper

[STATE_DEFINITION]
LocalVars:
  filterAlpha: "Active" | "Standby"
  filterBeta: "Active" | "Standby"
  objects: { color: string, shape: string }[] (length 4)

[EXTERNAL_INFO_MAPPING]
Info1_Baseline (Filter Alpha):
  Active -> Reject Red, Green
  Standby -> Reject Blue

Info2_Modifier (Filter Beta):
  Active -> Require 3 sides (Triangle)
  Standby -> Require 0 sharp corners (Circle)

[VALIDATION_LOGIC]
TargetState: The single object in `objects` that passes both Info1 and Info2 logic.
OnSubmit(selectedObject):
  if selectedObject == TargetState -> return SUCCESS
  else -> return STRIKE

[UI_REQUIREMENTS]
- Render Filter statuses.
- Render 4 objects with clear visual color and geometry.