# [MODULE SPEC: MOD_01_WIRE]
Type: Logic Component
Dependencies: BaseModuleWrapper, FirebaseContext

[STATE_DEFINITION]
LocalVars:
  serialNumber: string (3 digits)
  wires: string[] (length 3 or 4, all visual representation is "grey")

[EXTERNAL_INFO_MAPPING]
Info1_Baseline (Derived from serialNumber & wire length):
  if endsWithEven(serialNumber) & 3 wires -> [Red, Blue, Yellow]
  if endsWithEven(serialNumber) & 4 wires -> [Red, Blue, Blue-Striped White, Yellow]
  if endsWithOdd(serialNumber) & 3 wires -> [Blue, Yellow, Red]
  if endsWithOdd(serialNumber) & 4 wires -> [Yellow, Red, Red-Striped White, Blue]

Info2_Modifier (Cutting Protocol based on Info1 array):
  if count(Red) == 1 -> cut last wire
  else if count(Blue) > 1 -> cut first Blue wire
  else if lastWire == Yellow -> cut first wire
  else -> cut second wire

[VALIDATION_LOGIC]
TargetState: Apply(Info2_Modifier, Info1_Baseline)
OnSubmit(wireIndex):
  if wireIndex == TargetState -> return SUCCESS
  else -> return STRIKE

[UI_REQUIREMENTS]
- Render 3 or 4 interactive, colorless wires.
- Render serial number display.