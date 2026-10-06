import { useEffect, useMemo, useState } from "react";
import type { AnyModuleState, Difficulty, LocalVarsMap, ModuleAnswerMap, ModuleId } from "../types/db-schema";
import { ALL_MODULE_IDS, definitionById } from "../lib/modules";
import { runAdvance, runInfo, runReset, runVerify } from "../lib/modules/contract";
import { createRng } from "../lib/rng";
import { ModuleConsole } from "../components/modules/registry";
import { InfoPanel } from "../components/InfoPanel";
import { DIFFICULTIES, DIFFICULTY_IDS } from "../lib/gameConfig";
import { useT } from "../lib/i18n/useT";

interface ModuleSandboxProps {
  onExit: () => void;
}

/** Sandbox clock: a ten-minute countdown that wraps so time-based modules can be tested repeatedly. */
function useSandboxClock(): { secondsLeft: number; reset: () => void } {
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const elapsedSeconds = Math.floor((now - startedAt) / 1000);
  const secondsLeft = 600 - (elapsedSeconds % 600);
  return { secondsLeft, reset: () => setStartedAt(Date.now()) };
}

function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

/**
 * Dev-only sandbox: deals a single module, renders its console plus its Info 1 / Info 2 pages,
 * and verifies answers in memory. No Firebase at all. Reachable only via the `/dev_test` route.
 */
export function ModuleSandbox({ onExit }: ModuleSandboxProps) {
  const t = useT();
  const [index, setIndex] = useState(0);
  const [seed, setSeed] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("STANDARD");
  const moduleId: ModuleId = ALL_MODULE_IDS[index];
  const definition = definitionById(moduleId);

  // Generate a fresh instance whenever the module or seed changes. `seed` is referenced inside so
  // it is a real dependency (bumping it re-deals a new random state).
  const initial: AnyModuleState = useMemo(() => {
    void seed;
    const rng = createRng();
    return { moduleId, isSolved: false, localVars: definition.generate(rng, difficulty) } as unknown as AnyModuleState;
  }, [moduleId, seed, difficulty, definition]);

  const [state, setState] = useState<AnyModuleState>(initial);
  const [isSolved, setIsSolved] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const sandboxClock = useSandboxClock();
  const secondsLeft = sandboxClock.secondsLeft;

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
    <main className="page dev-sandbox">
      <header className="dev-sandbox-header">
        <div className="dev-sandbox-brand" aria-hidden="true">◈</div>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 8, flex: 1 }}>
        <div className="stack" style={{ gap: 2 }}>
          <span className="tag">{t("dev.label")}</span>
          <span className="hud-value font-display">{definition.name}</span>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onExit}>
          {t("dev.exit")}
        </button>
        </div>
      </header>

      <div className="dev-sandbox-toolbar">
        <div className={`dev-sandbox-clock ${secondsLeft <= 30 ? "is-critical" : ""}`} aria-live="polite">
          <span className="tag">Global timer</span>
          <strong className="dev-sandbox-clock-value">{formatClock(secondsLeft)}</strong>
          <button type="button" className="btn btn-ghost dev-sandbox-clock-reset" onClick={sandboxClock.reset}>{t("dev.resetClock")}</button>
        </div>
        <div className="dev-sandbox-difficulty">
          <span className="tag">{t("dev.dealDifficulty")}</span>
          <div className="chip-group">
            {DIFFICULTY_IDS.map((id) => (
              <button key={id} type="button" className={`chip ${difficulty === id ? "is-active" : ""}`} aria-pressed={difficulty === id} onClick={() => { setDifficulty(id); setSeed((value) => value + 1); }}>
                {DIFFICULTIES[id].label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setIndex((i) => (i - 1 + ALL_MODULE_IDS.length) % ALL_MODULE_IDS.length)}
        >
          {t("dev.prev")}
        </button>
        <span className="muted" style={{ alignSelf: "center" }}>
          {index + 1} / {ALL_MODULE_IDS.length} · {moduleId}
        </span>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setIndex((i) => (i + 1) % ALL_MODULE_IDS.length)}
        >
          {t("dev.next")}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setSeed((s) => s + 1)}>
          {t("dev.redeal")}
        </button>
        {feedback ? (
          <span className={`badge ${feedback === "SOLVED" ? "is-1" : ""}`} style={{ alignSelf: "center" }}>
            {feedback}
          </span>
        ) : null}
      </div>

      <div className="dev-sandbox-workspace">
        <div className="module-grid dev-sandbox-console">
        <ModuleConsole
          state={state}
          disabled={isSolved}
          submit={submit}
          patch={patch}
          secondsLeft={secondsLeft}
          difficulty={difficulty}
        />
        </div>

        <section className="info-section dev-sandbox-manuals">
          <header className="dev-sandbox-section-head">
            <span className="tag">{t("dev.informantReference")}</span>
            <h2 className="dev-sandbox-section-title">{t("dev.manualPages")}</h2>
            <p className="muted">{t("dev.manualBody")}</p>
          </header>
        <InfoPanel moduleName={definition.name} ownerName="Owner" page={1} tables={info1} />
        <InfoPanel moduleName={definition.name} ownerName="Owner" page={2} tables={info2} />
        </section>
      </div>

      <p className="muted dev-sandbox-note">{t("dev.note")}</p>
    </main>
  );
}
