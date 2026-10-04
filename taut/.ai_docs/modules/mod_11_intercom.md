# [MODULE SPEC: MOD_11_INTERCOM]
Type: Translation Component
Dependencies: BaseModuleWrapper

[Difficulty-scaled vocabulary]
  Pools (>= 10): IntercomMessage KLAATU..KEYMASTER and IntercomResponse BARADA..ABORT.
  `generate(rng, difficulty)` deals `n` incoming words (the owner's among them) and `n` reply
  options (the correct reply among them); vocabSize(): 5 for Beginner, 10 otherwise.
  Info 1 iterates the stored `messages`; the Info 2 protocol iterates the same stored meanings.

[STATE_DEFINITION]
LocalVars:
  incomingMessage: IntercomMessage      (the owner's word)
  messages: IntercomMessage[]           (per-instance list of incoming words; contains the owner's)
  responses: IntercomResponse[]         (per-instance reply options; contains the correct reply)

[EXTERNAL_INFO_MAPPING]
Info1_Baseline (Dictionary):
  KLAATU -> Requesting Status
  GORT -> Hostile Presence
  VERATA -> Requesting Supply Drop

Info2_Modifier (Protocol):
  Requesting Status -> "NIKTO"
  Hostile Presence -> "BARADA"
  Requesting Supply Drop -> "SHREK"

[VALIDATION_LOGIC]
TargetState: Apply(Info2_Modifier, Info1_Baseline)
OnSubmit(buttonPressed):
  if buttonPressed == TargetState -> return SUCCESS
  else -> return STRIKE

[UI_REQUIREMENTS]
- Render incoming message screen.
- Render 4 response buttons with alien text.