import { useState } from "react";
import { MAX_ROOM_NAME_LENGTH } from "../lib/gameConfig";
import { createRoom, joinRoom } from "../utils/room";
import { LanguageToggle } from "../components/LanguageToggle";
import { useT } from "../lib/i18n/useT";

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
  const t = useT();
  const [code, setCode] = useState("");
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const cleanCode = code.replace(/\D/g, "").slice(0, 6);

  return (
    <main className="page page-center landing-page">
      <div className="landing-shell">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <button type="button" className="btn btn-ghost" onClick={() => setShowHowToPlay(true)}>
            {t("home.howToPlay")}
          </button>
          <LanguageToggle />
        </div>
        <section className="card stack landing-card">
          <header className="stack text-center" style={{ gap: 6 }}>
            <span className="tag">{t("home.tagline")}</span>
            <h1 className="font-display landing-title">{t("home.title")}</h1>
            <p className="muted" style={{ margin: 0 }}>
              {t("home.subtitle")}
            </p>
          </header>

          <label className="field">
            <span className="tag">{t("home.roomCode")}</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={code}
              maxLength={6}
              placeholder={t("home.roomCodePlaceholder")}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </label>
          <button
            type="button"
            className="btn btn-block landing-primary"
            disabled={cleanCode.length !== 6}
            onClick={() => onChooseIntent({ kind: "JOIN", code: cleanCode })}
          >
            {t("home.join")}
          </button>
          <div className="landing-divider"><span>{t("common.or")}</span></div>
          <button type="button" className="btn btn-ghost btn-block" onClick={() => onChooseIntent({ kind: "CREATE" })}>
            {t("home.create")}
          </button>
          <p className="muted text-center" style={{ margin: 0, fontSize: 12 }}>
            {t("home.playerRange")}
          </p>
        </section>
      </div>

      {showHowToPlay ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowHowToPlay(false)}>
          <section className="card stack landing-help" role="dialog" aria-modal="true" aria-labelledby="how-to-play-title" onClick={(event) => event.stopPropagation()}>
            <header className="row" style={{ justifyContent: "space-between" }}>
              <h2 id="how-to-play-title" className="font-display" style={{ margin: 0 }}>{t("home.helpTitle")}</h2>
              <button type="button" className="btn btn-ghost" onClick={() => setShowHowToPlay(false)}>{t("common.close")}</button>
            </header>
            <ol className="landing-steps">
              <li>{t("home.helpStep1")}</li>
              <li>{t("home.helpStep2")}</li>
              <li>{t("home.helpStep3")}</li>
              <li>{t("home.helpStep4")}</li>
            </ol>
          </section>
        </div>
      ) : null}
    </main>
  );
}

export function NameStep({ intent, onBack, onEnterRoom }: NameStepProps) {
  const t = useT();
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
      setError(err instanceof Error ? err.message : t("name.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page page-center landing-page">
      <section className="card stack landing-name-card">
        <button type="button" className="btn btn-ghost landing-back" onClick={onBack}>{t("common.back")}</button>
        <header className="stack text-center" style={{ gap: 6 }}>
          <span className="tag">{intent.kind === "CREATE" ? t("name.newMission") : t("name.joiningRoom", { code: intent.code })}</span>
          <h1 className="font-display landing-title">{t("name.title")}</h1>
        </header>
        <label className="field">
          <span className="tag">{t("name.yourName")}</span>
          <input autoFocus type="text" value={name} maxLength={MAX_ROOM_NAME_LENGTH} autoComplete="nickname" placeholder={t("name.namePlaceholder")} onChange={(event) => setName(event.target.value.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " "))} onKeyDown={(event) => { if (event.key === "Enter") void submit(); }} />
        </label>
        {error ? <p className="banner is-error">{error}</p> : null}
        <button type="button" className="btn btn-block landing-primary" disabled={!name.trim() || busy} onClick={() => void submit()}>
          {busy ? t("common.connecting") : intent.kind === "CREATE" ? t("name.create") : t("name.join")}
        </button>
      </section>
    </main>
  );
}
