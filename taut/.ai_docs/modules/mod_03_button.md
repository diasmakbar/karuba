# [MODULE SPEC: MOD_03_BUTTON]
Type: Timing Component
Name: Confusing Button
Dependencies: BaseModuleWrapper

[STATE_DEFINITION]
LocalVars:
  buttonColor: "Red" | "Blue" | "White" | "Yellow"
  buttonLabel: "Abort" | "Detonate" | "Hold" | "Press"
  lightColor: "Red" | "Blue" | "White" | "Yellow"   (ignored when lightState == "OFF")
  lightState: "OFF" | "SOLID" | "FLASHING"
  serialNumber: string (3 digits)
  isHolding: boolean
  holdStartedAt: number | null

[EXTERNAL_INFO_MAPPING]
Info1_Baseline (Action cascade):
  The ordered ACTION_RULES table (config). Evaluated top-to-bottom; the first rule whose
  DEFINED conditions all match decides HOLD vs DROP. A condition property that is undefined
  is a wildcard. Conditions read button color, label, serial parity and light state.
  No row is highlighted — the Informant must ask the owner for the button's color, label,
  the indicator light's state, and the serial parity.

Info2_Modifier (Release timing):
  Keyed by the indicator light's state AND color.
    - lightState == "OFF"  -> a single color-agnostic rule applies (color skipped).
    - lightState == "SOLID" or "FLASHING" -> the light's color selects the rule.
  No row is highlighted — the Informant must ask the owner for the light's color and state.

[VALIDATION_LOGIC]
TargetState: Apply(Info1_Baseline cascade, LocalVars) -> HOLD | DROP
OnSubmit(action, secondsLeft):
  if action == EARLY -> STRIKE
  if directive == DROP -> SUCCESS iff action == RELEASE_NOW
  if directive == HOLD  -> SUCCESS iff releaseSatisfied(timingRuleFor(lightState, lightColor).release, action, secondsLeft)

Press semantics (owner console):
  The console measures press duration locally (threshold 1000ms).
    - held < 1s then released -> action = "RELEASE_NOW"
    - held >= 1s then released -> action = "HOLD_TO_TARGET"
  pointerLeave while still pressed is resolved with the same duration rule. A guard prevents
  pointerUp + pointerLeave from double-firing a release.

[UI_REQUIREMENTS]
- Render a single large interactable button colored by buttonColor, labelled by buttonLabel.
- Render a noticeably larger colored indicator LED beside the button: dark (OFF), steady
  (SOLID, `is-lit`, `.led-lg`), or blinking (FLASHING). No text label on the LED.
- Render the serial number. The global countdown lives in the HUD — the console does NOT show
  a shared clock and offers no separate "release now" button.
- The owner sees all of the above; the two Informant manuals never expose these variables.
