# [MODULE SPEC: MOD_12_SAFE_ZONE]
Type: Intersection Component
Dependencies: BaseModuleWrapper

[STATE_DEFINITION]
LocalVars:
  threat: "Laser" | "Plasma" | "Kinetic" | "Sonic" | "EMP" | "Acid" | "Railgun"
  room: "Kitchen" | "Armory" | "Server" | "Laboratory" | "Reactor" | "Hangar" | "Vault"
  gridSize: number            // NxN grid: Beginner 3, Standard 4, Extreme 6
  threatCells: Record<string, string[]>   // per-instance cells each listed threat covers
  roomCells: Record<string, string[]>     // per-instance cells each listed room covers

[EXTERNAL_INFO_MAPPING]
Info1_Baseline (Threat coverage):
  For each listed threat -> the exact cells it covers this instance.
Info2_Modifier (Room coverage):
  For each listed room -> the exact cells it covers this instance.

[VALIDATION_LOGIC]
TargetState: The single cell present in BOTH the owner's threat-covage set AND the owner's
  room-coverage set (their INTERSECTION). This is INCLUSION, not elimination.
OnSubmit(coord):
  if coord == intersection(threatCells[threat], roomCells[room]) -> return SUCCESS
  else -> return STRIKE

[INVARIANT]
For EVERY (threat_i, room_j) pair across the full active vocabulary the intersection must be
EXACTLY ONE cell, and all pair answers must be DISTINCT (no two pairs collide). Generation
re-rolls (bounded) if the invariant fails.

[DIFFICULTY]
  BEGINNER: 3x3 grid, 3 threats + 3 rooms.
  STANDARD: 4x4 grid, 5 threats + 5 rooms.
  EXTREME:  6x6 grid, 7 threats + 7 rooms.

[UI_REQUIREMENTS]
- Render an NxN grid (columns A.., rows 1..gridSize) sized from localVars.gridSize.
- Render Threat and Room display text.
- Do NOT highlight the answer.
