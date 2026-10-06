import type { AnyModuleState, LocalVarsMap, ModuleAnswerMap, ModuleId } from "../../types/db-schema";
import type { ModuleOutcome } from "../../utils/game";

/**
 * Props shared by every module console. `state` arrives as the union record stored in
 * Firebase; each console narrows it with `narrowModuleState` so the vars and the answers
 * it can submit stay exact for that one module.
 */
export interface ModuleConsoleProps {
  state: AnyModuleState;
  disabled: boolean;
  submit: (answer: ModuleAnswerMap[ModuleId]) => Promise<ModuleOutcome>;
  patch: (vars: LocalVarsMap[ModuleId]) => Promise<void>;
  /** Shared countdown seconds, derived from `globalEndTime` by the Room. Read-only clock. */
  secondsLeft: number;
  /** Current difficulty controls beginner-only goal hints and difficulty-scaled rendering. */
  difficulty: import("../../types/db-schema").Difficulty;
}
