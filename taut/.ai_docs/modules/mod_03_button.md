# [MODULE SPEC: MOD_03_BUTTON]
Type: Timing Component
Dependencies: BaseModuleWrapper

[STATE_DEFINITION]
LocalVars:
  cipher: string (4 letters, e.g., "XYZA")
  serialNumber: string (3 digits)
  isHolding: boolean

[EXTERNAL_INFO_MAPPING]
Info1_Baseline (Decryption):
  if endsWithEven(serialNumber) -> XYZA="HOLD", VBNM="PUSH"
  if endsWithOdd(serialNumber) -> XYZA="WAIT", VBNM="DROP"

Info2_Modifier (Timing Protocol):
  if "HOLD" -> release when countdown timer contains '4'
  if "WAIT" -> release when countdown timer contains '1'
  if "PUSH" -> release on even seconds
  if "DROP" -> release immediately

[VALIDATION_LOGIC]
TargetState: Apply(Info2_Modifier, Info1_Baseline)
OnSubmit(releaseTime):
  if matchesCondition(releaseTime, TargetState) -> return SUCCESS
  else -> return STRIKE

[UI_REQUIREMENTS]
- Render large interactable button displaying the cipher.
- Render serial number.