# [MODULE SPEC: MOD_11_INTERCOM]
Type: Two-Stage Translation Component
Dependencies: BaseModuleWrapper

[STATE_DEFINITION]
LocalVars:
  incomingMessage: IntercomMessage    // displayed to owner
  messages: IntercomMessage[]         // owner choices; includes computed final message
  meaningMap: Record<string, string>  // Info 2 derangement over all English meanings

[MANUALS]
Info 1 (Informant 1): complete message → meaning dictionary. Do not highlight the owner's row.
Info 2 (Informant 2): meaning → randomized different meaning table. No meaning maps to itself.
Do not highlight the owner's row. Owner identifies incomingMessage to Informant 1, gets its meaning,
asks Informant 2 for the relayed meaning, then returns to Informant 1 and looks up the final message.

[VALIDATION_LOGIC]
meaning1 = DICTIONARY[incomingMessage]
meaning2 = meaningMap[meaning1]
finalMessage = inverse(DICTIONARY)[meaning2]
OnSubmit(message):
  if message == finalMessage -> SUCCESS
  else -> STRIKE

[GENERATION]
Generate a randomized derangement of all meanings (no fixed points), select incomingMessage, compute
the final message through the full chain, and deal the owner choices with finalMessage included.

[DIFFICULTY]
  Beginner: 5 message choices.
  Standard / Extreme: 10 message choices.

[UI_REQUIREMENTS]
- Display incomingMessage and message buttons (not the old Indonesian response buttons).
- Info 1 and Info 2 remain separate, with the owner relaying the returned meaning between informants.
- The selected final message must be present among the buttons.
