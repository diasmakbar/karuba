import { useState } from "react";
import { MAX_ROOM_NAME_LENGTH } from "../lib/gameConfig";
import { createRoom, joinRoom } from "../utils/room";

export type EntryIntent = { kind: "CREATE" } | { kind: "JOIN"; code: string };

interface HomeProps {
  onChooseIntent: (intent: EntryIntent) => void;
}

interface NameStepProps {
  intent: EntryIntent;
  onBack: () => void;
  onEnterRoom: (code: string) => void;
}

export function Home({ onChooseIntent }: HomeProps) {
  const [code, setCode] = useState("");
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const cleanCode = code.replace(/\D/g, "").slice(0, 6);

  return (
    <main className="page page-center landing-page">
      <div className="landing-shell">
        <button type="button" className="btn btn-ghost landing-howto" onClick={() => setShowHowToPlay(true)}>
          How to Play
        </button>
        <section className="card stack landing-card">
          <header className="stack text-center" style={{ gap: 6 }}>
            <span className="tag">A cooperative communication challenge</span>
            <h1 className="font-display landing-title">Welcome to TAUT SPACE</h1>
            <p className="muted" style={{ margin: 0 }}>
              Everyone has a problem. Everyone holds part of someone else's solution.
            </p>
          </header>

          <label className="field">
            <span className="tag">Room code</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={code}
              maxLength={6}
              placeholder="123 456"
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </label>
          <button
            type="button"
            className="btn btn-block landing-primary"
            disabled={cleanCode.length !== 6}
            onClick={() => onChooseIntent({ kind: "JOIN", code: cleanCode })}
          >
            Join game
          </button>
          <div className="landing-divider"><span>OR</span></div>
          <button type="button" className="btn btn-ghost btn-block" onClick={() => onChooseIntent({ kind: "CREATE" })}>
            Create a new game
          </button>
          <p className="muted text-center" style={{ margin: 0, fontSize: 12 }}>
            Rooms need 3–6 players, each on a separate device.
          </p>
        </section>
      </div>

      {showHowToPlay ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowHowToPlay(false)}>
          <section className="card stack landing-help" role="dialog" aria-modal="true" aria-labelledby="how-to-play-title" onClick={(event) => event.stopPropagation()}>
            <header className="row" style={{ justifyContent: "space-between" }}>
              <h2 id="how-to-play-title" className="font-display" style={{ margin: 0 }}>How to Play</h2>
              <button type="button" className="btn btn-ghost" onClick={() => setShowHowToPlay(false)}>Close</button>
            </header>
            <ol className="landing-steps">
              <li>Join a room with 3–6 players, then ready up.</li>
              <li>Each player receives a module and two different informants.</li>
              <li>Ask your informants for their separate manual pages. Share information verbally—your manuals are not visible to you.</li>
              <li>Solve your module before the shared timer expires. The team wins by clearing every phase.</li>
            </ol>
          </section>
        </div>
      ) : null}
    </main>
  );
}

export function NameStep({ intent, onBack, onEnterRoom }: NameStepProps) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const code = intent.kind === "CREATE" ? await createRoom(name) : await joinRoom(intent.code, name);
      onEnterRoom(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page page-center landing-page">
      <section className="card stack landing-name-card">
        <button type="button" className="btn btn-ghost landing-back" onClick={onBack}>← Back</button>
        <header className="stack text-center" style={{ gap: 6 }}>
          <span className="tag">{intent.kind === "CREATE" ? "New mission" : `Joining room ${intent.code}`}</span>
          <h1 className="font-display landing-title">What should we call you?</h1>
        </header>
        <label className="field">
          <span className="tag">Your name</span>
          <input autoFocus type="text" value={name} maxLength={MAX_ROOM_NAME_LENGTH} placeholder="Operative" onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void submit(); }} />
        </label>
        {error ? <p className="banner is-error">{error}</p> : null}
        <button type="button" className="btn btn-block landing-primary" disabled={!name.trim() || busy} onClick={() => void submit()}>
          {busy ? "Connecting…" : intent.kind === "CREATE" ? "Create room" : "Join room"}
        </button>
      </section>
    </main>
  );
}
