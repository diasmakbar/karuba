# [MODULE SPEC: MOD_03_BUTTON]
Type: Timing Component
Dependencies: BaseModuleWrapper

[STATE_DEFINITION]
LocalVars:
  buttonColor: "Red" | "Blue" | "White" | "Yellow"
  buttonLabel: "Abort" | "Detonate" | "Hold" | "Press"
  stripColor: "Red" | "Blue" | "White" | "Yellow"
  flashingLight: boolean
  serialNumber: string (3 digits)
  isHolding: boolean
  holdStartedAt: number | null

[EXTERNAL_INFO_MAPPING]
Info1_Baseline (Action cascade):
  The ordered ACTION_RULES table (config). Evaluated top-to-bottom; the first rule whose
  DEFINED conditions all match decides HOLD vs DROP. A condition property that is undefined
  is a wildcard. No row is highlighted — the Informant must ask the owner for the button's
  color, label, light status, and serial parity.

Info2_Modifier (Release timing):
  The STRIP_TIMING_RULES table (config), keyed by strip color. Only consulted when the cascade
  resolved to HOLD. No row is highlighted — the Informant must ask the owner for the strip color.

[VALIDATION_LOGIC]
TargetState: Apply(Info1_Baseline cascade, LocalVars) -> HOLD | DROP
OnSubmit(action, secondsLeft):
  if action == EARLY -> STRIKE
  if directive == DROP -> SUCCESS iff action == RELEASE_NOW
  if directive == HOLD  -> SUCCESS iff releaseSatisfied(STRIP_TIMING_RULES[stripColor], action, secondsLeft)

[UI_REQUIREMENTS]
- Render a large interactable button colored by buttonColor, labelled by buttonLabel.
- Render the side strip in stripColor and a flashing-light indicator.
- Render the serial number and the shared room clock.
- The owner sees all of the above; the two Informant manuals never expose these variables.
