import type { ModuleConsoleProps } from "./types";
import { CONSOLE_REGISTRY } from "./consoleRegistry";

/** Renders the owner console for a module state read out of Firebase. */
export function ModuleConsole(props: ModuleConsoleProps) {
  const Component = CONSOLE_REGISTRY[props.state.moduleId];
  return <Component {...props} />;
}
