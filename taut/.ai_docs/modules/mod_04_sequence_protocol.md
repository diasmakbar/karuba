# [MODULE SPEC: MOD_04_SEQUENCE_PROTOCOL]
Type: Memory Component
Dependencies: BaseModuleWrapper

[STATE_DEFINITION]
LocalVars:
  displayDigit: number (1-4)
  physicalButtons: number[] (length 4, randomized 1-4)
  currentStage: number (1 to 4)
  history: Record<stage, { positionPressed: number, labelPressed: number }>

[EXTERNAL_INFO_MAPPING]
Info1_Baseline (Stage 1 & 2 rules):
  Stage 1: mapping logic for displayDigit 1-4 to position (e.g., if 1 -> press pos 2)
  Stage 2: mapping logic relying on Stage 1 history

Info2_Modifier (Stage 3 & 4 rules):
  Stage 3: mapping logic relying on Stage 1 and 2 history
  Stage 4: mapping logic relying on previous history

[VALIDATION_LOGIC]
TargetState: Derived dynamically per stage using history + Info mappings.
OnSubmit(buttonIndex):
  if correct -> increment currentStage
  if currentStage == 5 -> return SUCCESS
  else -> reset to Stage 1, return STRIKE

[UI_REQUIREMENTS]
- Render display digit.
- Render 4 numbered buttons in randomized horizontal order.
- Render stage progress indicators (4 LEDs).