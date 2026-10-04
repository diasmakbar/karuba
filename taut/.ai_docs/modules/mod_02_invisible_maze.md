# [MODULE SPEC: MOD_02_INVISIBLE_MAZE]
Type: Pathfinding Component
Dependencies: BaseModuleWrapper

[STATE_DEFINITION]
LocalVars:
  mazeId: "Alpha" | "Beta" | "Gamma"
  startCoord: string (e.g., "A1" to "F6")
  finishCoord: string (e.g., "A1" to "F6")
  currentCoord: string
  serialNumber: string (alphanumeric, required to check last digit)

[INITIALIZATION_LOGIC]
- Randomize `mazeId`, `startCoord`, and `finishCoord` at the start of the module.
- Solvability Constraint: The system MUST validate that a continuous, valid path exists between `startCoord` and `finishCoord` avoiding the selected `mazeId`'s walls. If the generated pair is unsolvable/isolated, the system must reroll the coordinates until a valid path is found.

[EXTERNAL_INFO_MAPPING]
Info1_Baseline (Architecture Maps - 6x6 Grid):
  // Format: "Cell1-Cell2" means there is a wall blocking movement between Cell1 and Cell2.
  Alpha -> Walls between: A1-A2, B1-C1, C1-C2, D2-E2, E1-F1, F2-F3, A3-B3, B3-B4, C3-D3, D3-D4, E4-F4, A5-A6, C5-C6, D5-E5.
  Beta  -> Walls between: A2-B2, B2-B3, C1-D1, E2-E3, D3-D4, E3-F3, B4-C4, A5-B5, C5-D5, E4-F4, E5-E6, F5-F6.
  Gamma -> Walls between: A1-B1, A2-A3, C2-D2, B3-C3, D3-E3, E2-E3, F1-F2, A4-B4, B4-B5, B5-C5, D5-D6, E5-F5.

Info2_Modifier (D-Pad Protocol based on serialNumber):
  if endsWithEven(serialNumber) -> Controls are ROTATED 90° COUNTER-CLOCKWISE   
     (UP=LEFT, RIGHT=UP, DOWN=RIGHT, LEFT=DOWN)
  if endsWithOdd(serialNumber) -> Controls are ROTATED 90° CLOCKWISE 
     (UP=RIGHT, RIGHT=DOWN, DOWN=LEFT, LEFT=UP)

[VALIDATION_LOGIC]
TargetState: Path from currentCoord to finishCoord avoiding Info1_Baseline walls.
OnSubmit(physicalButtonPress):
  mappedDirection = Apply(Info2_Modifier, physicalButtonPress, serialNumber)
  
  if hitsWall(currentCoord, mappedDirection, Info1_Baseline) -> return STRIKE
  if isOutOfBounds(currentCoord, mappedDirection) -> return STRIKE
  
  // If valid move:
  newCoord = Move(currentCoord, mappedDirection)
  if newCoord == finishCoord -> return SUCCESS
  else -> update currentCoord = newCoord

[UI_REQUIREMENTS]
- Render 6x6 grid showing ONLY Start (e.g., green dot), Finish (e.g., red dot), and Current Token.
- Walls MUST remain invisible on the UI.
- Render physical D-pad (Up, Down, Left, Right).
- Render serial number display.