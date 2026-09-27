# [MODULE SPEC: MOD_15_BIOMETRIC_SCANNER]
Type: Logic Component
Dependencies: BaseModuleWrapper

[STATE_DEFINITION]
LocalVars:
  personName: "Jane Smith" | "John Doe" | "Alan Turing"
  destination: "Maintenance" | "Engineering" | "Server Room"

[EXTERNAL_INFO_MAPPING]
Info1_Baseline (Clearance Required):
  Maintenance -> Level 2
  Engineering -> Level 4
  Server Room -> Level 5

Info2_Modifier (Security Log):
  Jane Smith -> Level 5
  John Doe -> Level 2
  Alan Turing -> Level 4

[VALIDATION_LOGIC]
TargetState: "APPROVE" if Info2_Modifier >= Info1_Baseline, else "REJECT"
OnSubmit(action):
  if action == TargetState -> return SUCCESS
  else -> return STRIKE

[UI_REQUIREMENTS]
- Render Person Name and Destination on a screen.
- Render Approve (Green) and Reject (Red) buttons.