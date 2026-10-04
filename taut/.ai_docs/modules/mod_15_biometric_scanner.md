# [MODULE SPEC: MOD_15_BIOMETRIC_SCANNER]
Type: Logic Component
Dependencies: BaseModuleWrapper

[Difficulty-scaled vocabulary]
  Pools (>= 10): PersonName (Jane Smith..Barbara L.) and Destination (Maintenance..Bridge).
  `generate(rng, difficulty)` deals `n` people and `n` destinations (the scanned person and the
  target destination are among them); vocabSize(): 5 for Beginner, 10 otherwise.
  Info 1 iterates the stored `destinations`; Info 2 iterates the stored `people`.

[STATE_DEFINITION]
LocalVars:
  personName: PersonName                (the scanned person)
  destination: Destination              (the target destination)
  people: PersonName[]                  (per-instance list shown in Info 2; contains personName)
  destinations: Destination[]           (per-instance list shown in Info 1; contains destination)

[EXTERNAL_INFO_MAPPING]
Info1_Baseline (Clearance Required):
  Maintenance -> Level 2
  Engineering -> Level 4
  Server Room -> Level 5

Info2_Modifier (Security Log):
  Jane Smith -> Level 5
  John Doe -> Level 2
  Alan Turing -> Level 4

[VALIDATION_LOGIC]
TargetState: "APPROVE" if Info2_Modifier >= Info1_Baseline, else "REJECT"
OnSubmit(action):
  if action == TargetState -> return SUCCESS
  else -> return STRIKE

[UI_REQUIREMENTS]
- Render Person Name and Destination on a screen.
- Render Approve (Green) and Reject (Red) buttons.