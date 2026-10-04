# [MODULE SPEC: MOD_08_RADAR]
Type: Spatial Component
Dependencies: BaseModuleWrapper

[STATE_DEFINITION]
LocalVars:
  constellation: Constellation          (the correct one for this instance)
  windDirection: WindDirection          (the correct one for this instance)
  constellations: Constellation[]       (per-instance list shown in Info 1; contains the correct one)
  windDirections: WindDirection[]       (per-instance list shown in Info 2; contains the correct one)
  selectedCoord: string

  Constellation pool (>= 10): Ursa, Orion, Draco, Lyra, Cassiopeia, Cygnus, Aquila, Pegasus, Corvus, Vela
  WindDirection pool (>= 10): North, East, South, West, NorthEast, SouthEast, SouthWest, NorthWest,
                              NorthNorthWest, SouthSouthEast

[DIFficulty-SCALED VOCABULARY]
  BEGINNER -> 5 constellations + 5 winds; STANDARD/EXTREME -> 10 + 10 (vocabSize()).
  `generate(rng, difficulty)` deals `n` constellations (one is the correct one) and `n` winds
  (one is the correct one). Info 1 iterates the stored `constellations`; Info 2 iterates the
  stored `windDirections` — never the full static config list.

[EXTERNAL_INFO_MAPPING]
Info1_Baseline (Epicenter chart):
  Per-instance constellations with their epicenters (EPICENTER map). The correct row highlights.

Info2_Modifier (Drift Pattern):
  Per-instance winds with their drift rule (DRIFT_RULE map). The correct row highlights.

[VALIDATION_LOGIC]
TargetState: epicenter(constellation) + drift(windDirection), clamped to the 5x5 grid boundaries.
OnSubmit(coord):
  if coord == TargetState -> return SUCCESS
  else -> return STRIKE

[UI_REQUIREMENTS]
- Render 5x5 grid (A-E, 1-5).
- Render visual Constellation shape and Wind Direction arrow.
