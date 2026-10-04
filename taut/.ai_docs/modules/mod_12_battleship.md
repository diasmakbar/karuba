# [MODULE SPEC: MOD_12_BATTLESHIP]
Type: Coordinate Intersection Component
Dependencies: BaseModuleWrapper

[STATE_DEFINITION]
LocalVars:
  targetShip: string                 // e.g. Ship Alpha
  incomingShot: string               // e.g. Shot #1
  gridSize: number                   // NxN: Beginner 6, Standard 8, Extreme 10
  shipDeployments: Record<string, string[]> // every ship -> occupied coordinates
  shotTrajectories: Record<string, string[]> // every shot -> coordinates it hits

[EXTERNAL_INFO_MAPPING]
Info 1 (Informant 1):
  Table of every ship and its exact deployed coordinates.
  Do not highlight or otherwise reveal targetShip.
Info 2 (Informant 2):
  Table of every shot and its exact hit coordinates.
  Do not highlight or otherwise reveal incomingShot.
Neither informant knows which ship or shot the owner is solving; the owner asks them.

[VALIDATION_LOGIC]
TargetState: The one coordinate in BOTH shipDeployments[targetShip] and
  shotTrajectories[incomingShot]. This is inclusion / Venn intersection.
OnSubmit(coord):
  if coord equals the unique intersection coordinate -> SUCCESS
  else -> STRIKE

[GENERATION_INVARIANT]
Every ship deployment is a contiguous horizontal or vertical line of cells.
The complete board and selected targetShip/incomingShot pair are re-rolled unless their coordinate
sets intersect in EXACTLY ONE valid board coordinate. Generation is bounded and reports an error
rather than emitting an invalid/unplayable module state.

[OWNER_UI]
- Display TARGET: targetShip and INCOMING: incomingShot.
- Render an empty NxN coordinate grid for selection.
- Never draw deployments or trajectories on the owner's grid.

[DIFFICULTY]
  BEGINNER: 6x6 grid.
  STANDARD: 8x8 grid.
  EXTREME:  10x10 grid.
