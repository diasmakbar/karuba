import { useEffect, useMemo, useState } from "react";
import type { AnyModuleState, LocalVarsMap, ModuleAnswerMap, ModuleId } from "../types/db-schema";
import { ALL_MODULE_IDS, definitionById } from "../lib/modules";
import { runAdvance, runInfo, runReset, runVerify } from "../lib/modules/contract";
import { createRng } from "../lib/rng";
import { ModuleConsole } from "../components/modules/registry";
import { InfoPanel } from "../components/InfoPanel";

interface ModuleSandboxProps {
  onExit: () => void;
}

/** A throwaway shared clock (counts down, then wraps) so time-based modules have something to read. */
function useSandboxClock(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return Math.max(0, Math.floor((600_000 - (now % 600_000)) / 1000));
}

/**
 * Dev-only sandbox: deals a single module, renders its console plus its Info 1 / Info 2 pages,
 * and verifies answers in memory. No Firebase at all. Reachable only via `?dev=modules`.
 */
export function ModuleSandbox({ onExit }: ModuleSandboxProps) {
  const [index, setIndex] = useState(0);
  const [seed, setSeed] = useState(0);
  const moduleId: ModuleId = ALL_MODULE_IDS[index];
  const definition = definitionById(moduleId);

  // Generate a fresh instance whenever the module or seed changes. `seed` is referenced inside so
  // it is a real dependency (bumping it re-deals a new random state).
  const initial: AnyModuleState = useMemo(() => {
    void seed;
    const rng = createRng();
    return { moduleId, isSolved: false, localVars: definition.generate(rng) } as unknown as AnyModuleState;
  }, [moduleId, seed, definition]);

  const [state, setState] = useState<AnyModuleState>(initial);
  const [isSolved, setIsSolved] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const secondsLeft = useSandboxClock();

  // Re-deal when the selected module/seed changes.
  useEffect(() => {
    setState(initial);
    setIsSolved(false);
    setFeedback(null);
  }, [initial]);

  const info1 = runInfo("info1", definition, initial.localVars);
  const info2 = runInfo("info2", definition, initial.localVars);

  // Local, in-memory equivalents of the Room's submit/patch — no network writes.
  const submit = async (answer: ModuleAnswerMap[ModuleId]) => {
    const correct = runVerify(definition, state.localVars, answer);
    if (!correct) {
      const resetVars = runReset(definition, state.localVars);
      setState({ ...state, localVars: resetVars } as AnyModuleState);
      setFeedback("STRIKE");
      return "STRIKE" as const;
    }
    const advanced = runAdvance(definition, state.localVars, answer);
    const finished = advanced === null;
    setState({ ...state, isSolved: finished, localVars: (advanced ?? state.localVars) } as AnyModuleState);
    setIsSolved(finished);
    setFeedback("SOLVED");
    return "SOLVED" as const;
  };

  const patch = async (vars: LocalVarsMap[ModuleId]) => {
    setState({ ...state, localVars: vars } as AnyModuleState);
  };

  return (
    <main className="page">
      <header className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div className="stack" style={{ gap: 2 }}>
          <span className="tag">Dev sandbox · no Firebase</span>
          <span className="hud-value font-display">{definition.name}</span>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onExit}>
          Exit dev
        </button>
      </header>

      <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setIndex((i) => (i - 1 + ALL_MODULE_IDS.length) % ALL_MODULE_IDS.length)}
        >
          ← Prev
        </button>
        <span className="muted" style={{ alignSelf: "center" }}>
          {index + 1} / {ALL_MODULE_IDS.length} · {moduleId}
        </span>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setIndex((i) => (i + 1) % ALL_MODULE_IDS.length)}
        >
          Next →
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setSeed((s) => s + 1)}>
          Re-deal
        </button>
        {feedback ? (
          <span className={`badge ${feedback === "SOLVED" ? "is-1" : ""}`} style={{ alignSelf: "center" }}>
            {feedback}
          </span>
        ) : null}
      </div>

      <div className="module-grid" style={{ marginTop: 16 }}>
        <ModuleConsole
          state={state}
          disabled={isSolved}
          submit={submit}
          patch={patch}
          secondsLeft={secondsLeft}
        />
      </div>

      <section className="info-section" style={{ marginTop: 20 }}>
        <span className="tag">Manual pages (what two informants would read)</span>
        <InfoPanel moduleName={definition.name} ownerName="Owner" page={1} tables={info1} />
        <InfoPanel moduleName={definition.name} ownerName="Owner" page={2} tables={info2} />
      </section>

      <p className="muted" style={{ marginTop: 16, fontSize: 12 }}>
        Answers are verified in-memory with the same module logic the game uses. Strikes reset
        state; a solved module stops accepting input. This page never touches Firebase.
      </p>
    </main>
  );
}
