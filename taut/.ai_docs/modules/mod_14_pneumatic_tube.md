# [MODULE SPEC: MOD_14_PNEUMATIC_TUBE]
Type: Routing Component
Dependencies: BaseModuleWrapper

[STATE_DEFINITION]
LocalVars:
  documentCode: "Doc-12" | "Doc-45" | "Doc-77"
  tubes: ["Red", "Blue", "Green", "Yellow"]

[EXTERNAL_INFO_MAPPING]
Info1_Baseline (Directory):
  Doc-12 -> Legal
  Doc-45 -> HR
  Doc-77 -> Accounting

Info2_Modifier (Tube Map):
  HR -> Red
  Legal -> Blue
  Accounting -> Green

[VALIDATION_LOGIC]
TargetState: Apply(Info2_Modifier, Info1_Baseline)
OnSubmit(tubeColor):
  if tubeColor == TargetState -> return SUCCESS
  else -> return STRIKE

[UI_REQUIREMENTS]
- Render Document Code label on a draggable/selectable capsule.
- Render 4 colored tubes.