# [MODULE SPEC: MOD_09_SYNTHESIZER]
Type: Mapping Component
Dependencies: BaseModuleWrapper

[Difficulty-scaled vocabulary]
  Pools (>= 10): SynthTarget Type A..J and Vial Alpha..Kappa. `generate(rng, difficulty)` deals
  `n` target types and `n` vials (vocabSize(): 5 for Beginner, 10 otherwise), where exactly one
  vial matches the dealt target. Info 1 iterates the stored `targetTypes`; Info 2 iterates the
  stored `vialIds` (never the full static lists).

[STATE_DEFINITION]
LocalVars:
  targetType: SynthTarget               (the correct one)
  targetTypes: SynthTarget[]            (per-instance list shown in Info 1; contains targetType)
  vialIds: VialId[]                     (per-instance list shown in Info 2; contains the match)

[EXTERNAL_INFO_MAPPING]
Info1_Baseline (Requirements):
  Type A -> Low pH, High Temp
  Type B -> Neutral pH, Low Temp
  Type C -> High pH, Low Temp

Info2_Modifier (Inventory):
  Alpha -> High pH, High Temp
  Beta -> Low pH, Low Temp
  Gamma -> High pH, Low Temp
  Delta -> Low pH, High Temp

[VALIDATION_LOGIC]
TargetState: Button matching Info1_Baseline requirements.
OnSubmit(buttonPressed):
  if buttonPressed == TargetState -> return SUCCESS
  else -> return STRIKE

[UI_REQUIREMENTS]
- Render Target Type display.
- Render 4 abstract buttons (Alpha, Beta, Gamma, Delta).