# [MODULE SPEC: MOD_14_PNEUMATIC_TUBE]
Type: Routing Component
Dependencies: BaseModuleWrapper

[Difficulty-scaled vocabulary]
  Pools (>= 10): DocumentCode Doc-12..Doc-33 with a 10-member Department set and 4 tubes.
  `generate(rng, difficulty)` deals `n` documents (the owner's among them); vocabSize(): 5 for
  Beginner, 10 otherwise. Info 1 iterates the stored `documents`; Info 2 lists the tubes for the
  departments those documents belong to.

[STATE_DEFINITION]
LocalVars:
  documentCode: DocumentCode            (the owner's document)
  documents: DocumentCode[]             (per-instance list shown in Info 1; contains the owner's)
  tubes: ["Red", "Blue", "Green", "Yellow"]

[EXTERNAL_INFO_MAPPING]
Info1_Baseline (Directory):
  Doc-12 -> Legal
  Doc-45 -> HR
  Doc-77 -> Accounting

Info2_Modifier (Tube Map):
  HR -> Red
  Legal -> Blue
  Accounting -> Green

[VALIDATION_LOGIC]
TargetState: Apply(Info2_Modifier, Info1_Baseline)
OnSubmit(tubeColor):
  if tubeColor == TargetState -> return SUCCESS
  else -> return STRIKE

[UI_REQUIREMENTS]
- Render Document Code label on a draggable/selectable capsule.
- Render 4 colored tubes.