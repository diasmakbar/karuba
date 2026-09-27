# [MODULE SPEC: MOD_11_INTERCOM]
Type: Translation Component
Dependencies: BaseModuleWrapper

[STATE_DEFINITION]
LocalVars:
  incomingMessage: "KLAATU" | "GORT" | "VERATA"
  responseButtons: ["BARADA", "NIKTO", "SHREK", "FIONA"]

[EXTERNAL_INFO_MAPPING]
Info1_Baseline (Dictionary):
  KLAATU -> Requesting Status
  GORT -> Hostile Presence
  VERATA -> Requesting Supply Drop

Info2_Modifier (Protocol):
  Requesting Status -> "NIKTO"
  Hostile Presence -> "BARADA"
  Requesting Supply Drop -> "SHREK"

[VALIDATION_LOGIC]
TargetState: Apply(Info2_Modifier, Info1_Baseline)
OnSubmit(buttonPressed):
  if buttonPressed == TargetState -> return SUCCESS
  else -> return STRIKE

[UI_REQUIREMENTS]
- Render incoming message screen.
- Render 4 response buttons with alien text.