# [MODULE SPEC: MOD_01_WIRE]
Type: Logic Component
Dependencies: BaseModuleWrapper, FirebaseContext

[STATE_DEFINITION]
LocalVars:
  serialNumber: string (3 digits)
  wireCount: 3 | 4 | 5 | 6
  wireColors: string[] (length == wireCount, top to bottom, each drawn randomly from
    {Red, White, Blue, Yellow, Black})
  leftPins: number[] (length == wireCount, distinct values from 1..6, strictly
    increasing — wire i starts at left pin A(leftPins[i]))
  rightPins: number[] (length == wireCount, distinct values from 1..6, strictly
    increasing — wire i ends at right pin B(rightPins[i]))
  cutIndex: number | null

[VISUAL_RULES]
- Wires are colourless (grey) connections between a left pin column (A1..A6) and a
  right pin column (B1..B6).
- All 6 pins on each side are ALWAYS rendered; unused pins stay empty.
- Wire ordering begins with the first on the top (wire 1 = topmost).
- No wire crossing: because leftPins and rightPins are both strictly increasing, a
  wire originating below another can never connect to a pin above it.

[EXTERNAL_INFO_MAPPING]
Info1_Colors (held by informant1Id — the ACTUAL colors, not a chart):
  A list of the color of each wire, top to bottom:
    Wire 1: <wireColors[0]>
    Wire 2: <wireColors[1]>
    ...
    Wire N: <wireColors[N-1]>

Info2_Manual (held by informant2Id — the cutting rules for the wire count,
  evaluated strictly in order, stop at the first rule that matches):

  3 wires:
    1. If there are no red wires, cut the second wire.
    2. Otherwise, if the last wire is white, cut the last wire.
    3. Otherwise, if there is more than one blue wire, cut the last blue wire.
    4. Otherwise, cut the last wire.

  4 wires:
    1. If there is more than one red wire and the last digit of the serial number
       is odd, cut the last red wire.
    2. Otherwise, if the last wire is yellow and there are no red wires, cut the
       first wire.
    3. Otherwise, if there is exactly one blue wire, cut the first wire.
    4. Otherwise, if there is more than one yellow wire, cut the last wire.
    5. Otherwise, cut the second wire.

  5 wires:
    1. If the last wire is black and the last digit of the serial number is odd,
       cut the fourth wire.
    2. Otherwise, if there is exactly one red wire and there is more than one
       yellow wire, cut the first wire.
    3. Otherwise, if there are no black wires, cut the second wire.
    4. Otherwise, cut the first wire.

  6 wires:
    1. If there are no yellow wires and the last digit of the serial number is
       odd, cut the third wire.
    2. Otherwise, if there is exactly one yellow wire and there is more than one
       white wire, cut the fourth wire.
    3. Otherwise, if there are no red wires, cut the last wire.
    4. Otherwise, cut the fourth wire.

[VALIDATION_LOGIC]
TargetState: Apply(Info2_Manual, wireColors, serialNumber)
OnSubmit(wireIndex):
  if wireIndex == TargetState -> return SUCCESS
  else -> return STRIKE

[UI_REQUIREMENTS]
- Render 3-6 interactive, colorless wires as connections between left pins
  (A1..AN) and right pins (B1..B6), with no crossings.
- Render serial number display.
- Only the one correct wire needs to be cut to disarm the module.
