import { useState } from "react";
import type { Difficulty, ModuleId, ModuleSelectionMode } from "../types/db-schema";
import { useRoom } from "../hooks/useRoom";
import { useUid } from "../hooks/useUid";
import { DIFFICULTIES, DIFFICULTY_IDS, MAX_PLAYERS_PER_ROOM, MIN_PLAYERS_TO_START } from "../lib/gameConfig";
import { ALL_MODULE_IDS, definitionById } from "../lib/modules";
import { playerList, setReady, setDifficulty, setAdvancedSettings, leaveLobby, startGame } from "../utils/room";
import { LanguageToggle } from "../components/LanguageToggle";
import { useT } from "../lib/i18n/useT";

interface LobbyProps {
  roomCode: string;
  onStart: () => void;
  onLeave: () => void;
}

/** Pre-game lobby: share the code, pick difficulty, ready up, host starts. Live-synced via Firebase. */
export function Lobby({ roomCode, onStart, onLeave }: LobbyProps) {
  const uid = useUid();
  const t = useT();
  const { room, loading, error, connected } = useRoom(roomCode);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customTime, setCustomTime] = useState("");
  const [customLevels, setCustomLevels] = useState("");

  if (loading) {
    return (
      <main className="page page-center">
        <p className="muted">{t("common.connecting")}</p>
      </main>
    );
  }

  if (error || !room) {
    return (
      <main className="page page-center">
        <div className="card stack" style={{ maxWidth: 420 }}>
          <p className="banner is-error">{error ?? t("room.roomNotFound")}</p>
          <button type="button" className="btn btn-block" onClick={onLeave}>
            {t("room.backHome")}
          </button>
        </div>
      </main>
    );
  }

  // Once the game starts, move everyone into the room screen.
  if (room.status !== "LOBBY") {
    onStart();
    return null;
  }

  const players = playerList(room);
  const isHost = room.hostId === uid;
  const me = uid ? room.players?.[uid] : undefined;
  const everyoneReady = players.length >= MIN_PLAYERS_TO_START && players.every((p) => p.isReady);
  const canStart = isHost && everyoneReady && !busy;
  const timePerLevelSeconds = room.timePerLevelSeconds ?? DIFFICULTIES[room.difficulty].timePerLevelSeconds;
  const totalLevels = room.totalLevels ?? DIFFICULTIES[room.difficulty].levels;
  const maxStrikes = room.maxStrikes ?? DIFFICULTIES[room.difficulty].maxStrikes;
  const moduleSelectionMode: ModuleSelectionMode = room.moduleSelectionMode ?? "RANDOM";
  const selectedModuleIds: ModuleId[] = room.selectedModuleIds?.length ? room.selectedModuleIds : ALL_MODULE_IDS;
  const saveAdvanced = (next: Partial<{ timePerLevelSeconds: number; totalLevels: number; maxStrikes: number; moduleSelectionMode: ModuleSelectionMode; selectedModuleIds: ModuleId[] }>) =>
    act(() => setAdvancedSettings(roomCode, {
      timePerLevelSeconds,
      totalLevels,
      maxStrikes,
      moduleSelectionMode,
      selectedModuleIds,
      ...next,
    }));

  const act = async (action: () => Promise<void>, after?: () => void) => {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      after?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="page page-center">
      <div className="card stack" style={{ maxWidth: 480, width: "100%" }}>
        <header className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div className="stack" style={{ gap: 2 }}>
            <span className="tag">{t("lobby.roomCode")}</span>
            <span className="hud-value font-display">{roomCode}</span>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <LanguageToggle />
            <button type="button" className="btn btn-ghost" onClick={copyCode}>
              {copied ? t("common.copied") : t("common.copy")}
            </button>
          </div>
        </header>

        {!connected ? <p className="banner is-warn">{t("common.reconnecting")}</p> : null}

        <div className="field">
          <span className="tag">{t("lobby.difficulty")}</span>
          {isHost ? (
            <div className="chip-group">
              {DIFFICULTY_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`chip ${room.difficulty === id ? "is-active" : ""}`}
                  disabled={busy}
                  onClick={() => act(() => setDifficulty(roomCode, id as Difficulty))}
                >
                  {DIFFICULTIES[id].label}
                </button>
              ))}
            </div>
          ) : (
            <p className="hud-value font-display" style={{ margin: 0 }}>
              {DIFFICULTIES[room.difficulty].label}
            </p>
          )}
          <p className="muted" style={{ margin: "6px 0 0", fontSize: 13 }}>
            {DIFFICULTIES[room.difficulty].blurb}
          </p>
        </div>

        {isHost ? (
          <section className="advanced-settings">
            <button type="button" className="btn btn-ghost btn-block advanced-toggle" aria-expanded={showAdvanced} onClick={() => setShowAdvanced((value) => !value)}>
              <span>{t("lobby.advanced")}</span><span aria-hidden="true">{showAdvanced ? "−" : "+"}</span>
            </button>
            {showAdvanced ? (
              <div className="stack advanced-content">
                <div className="field">
                  <span className="tag">{t("lobby.timePerPhase")}</span>
                  <div className="row">
                    {[3, 5, 8, 10].map((minutes) => (
                      <button key={minutes} type="button" className={`chip ${timePerLevelSeconds === minutes * 60 ? "is-active" : ""}`} disabled={busy} onClick={() => void saveAdvanced({ timePerLevelSeconds: minutes * 60 })}>{minutes} {t("common.minutesShort")}</button>
                    ))}
                  </div>
                  <div className="row">
                    <input aria-label={t("lobby.customMinutes")} type="number" min={1} max={60} value={customTime} placeholder={t("lobby.customMinutes")} onChange={(event) => setCustomTime(event.target.value)} />
                    <button type="button" className="btn btn-ghost" disabled={busy || !customTime || Number(customTime) < 1 || Number(customTime) > 60} onClick={() => void saveAdvanced({ timePerLevelSeconds: Math.round(Number(customTime) * 60) })}>{t("lobby.setTime")}</button>
                  </div>
                  <span className="muted">{t("lobby.current", { value: Math.floor(timePerLevelSeconds / 60) })}</span>
                </div>

                <div className="field">
                  <span className="tag">{t("lobby.phases")}</span>
                  <div className="row">
                    {[1, 2].map((count) => (
                      <button key={count} type="button" className={`chip ${totalLevels === count ? "is-active" : ""}`} disabled={busy} onClick={() => void saveAdvanced({ totalLevels: count })}>{count} {count === 1 ? t("common.phase") : t("common.phases")}</button>
                    ))}
                  </div>
                  <div className="row">
                    <input aria-label={t("lobby.customPhases")} type="number" min={1} max={10} value={customLevels} placeholder={t("lobby.customPhases")} onChange={(event) => setCustomLevels(event.target.value)} />
                    <button type="button" className="btn btn-ghost" disabled={busy || !customLevels || Number(customLevels) < 1 || Number(customLevels) > 10} onClick={() => void saveAdvanced({ totalLevels: Math.floor(Number(customLevels)) })}>{t("lobby.setPhases")}</button>
                  </div>
                  <span className="muted">{t("lobby.currentCount", { count: totalLevels, label: totalLevels === 1 ? t("common.phase") : t("common.phases") })}</span>
                </div>

                <div className="field">
                  <span className="tag">{t("lobby.maxStrikes")}</span>
                  <div className="row">
                    {[1, 2, 3, 4, 5, 6].map((count) => (
                      <button
                        key={count}
                        type="button"
                        className={`chip ${maxStrikes === count ? "is-active" : ""}`}
                        disabled={busy}
                        aria-pressed={maxStrikes === count}
                        onClick={() => void saveAdvanced({ maxStrikes: count })}
                      >
                        {count}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`chip ${maxStrikes === 0 ? "is-active" : ""}`}
                      disabled={busy}
                      aria-pressed={maxStrikes === 0}
                      onClick={() => void saveAdvanced({ maxStrikes: 0 })}
                    >
                      {t("lobby.noLimit")}
                    </button>
                  </div>
                  <span className="muted">
                    {maxStrikes === 0
                      ? t("lobby.noLimitHelp")
                      : t("lobby.currentLimit", { count: maxStrikes, label: maxStrikes === 1 ? t("common.strike") : t("common.strikes") })}
                  </span>
                </div>

                <div className="field">
                  <span className="tag">{t("lobby.moduleSelection")}</span>
                  <div className="chip-group">
                    {(["RANDOM", "MANUAL"] as const).map((mode) => (
                      <button key={mode} type="button" className={`chip ${moduleSelectionMode === mode ? "is-active" : ""}`} disabled={busy} onClick={() => void saveAdvanced({ moduleSelectionMode: mode })}>{mode === "RANDOM" ? t("lobby.random") : t("lobby.manualPool")}</button>
                    ))}
                  </div>
                  {moduleSelectionMode === "MANUAL" ? (
                    <>
                      <p className="muted" style={{ margin: 0, fontSize: 13 }}>{t("lobby.manualHelp", { count: players.length, max: MAX_PLAYERS_PER_ROOM })}</p>
                      <div className="module-pool-grid">
                        {ALL_MODULE_IDS.map((id) => {
                          const checked = selectedModuleIds.includes(id);
                          const next = checked ? selectedModuleIds.filter((item) => item !== id) : [...selectedModuleIds, id];
                          return <label key={id} className="module-pool-option"><input type="checkbox" checked={checked} disabled={busy} onChange={() => void saveAdvanced({ selectedModuleIds: next })} /><span>{definitionById(id).name}</span></label>;
                        })}
                      </div>
                      <span className={selectedModuleIds.length < players.length ? "banner is-warn" : "muted"}>
                        {t("lobby.selectedCount", { count: selectedModuleIds.length })}
                        {selectedModuleIds.length < players.length ? ` — ${t("lobby.needMore", { count: players.length - selectedModuleIds.length })}` : ""}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="stack" style={{ gap: 6 }}>
          <span className="tag">
            {t("lobby.playersHeader", { count: players.length, min: MIN_PLAYERS_TO_START, max: MAX_PLAYERS_PER_ROOM })}
          </span>
          {players.map((player) => (
            <div key={player.id} className="player-row">
              <span>
                {player.name}
                {player.id === room.hostId ? ` · ${t("common.host")}` : ""}
                {player.id === uid ? ` ${t("common.you")}` : ""}
              </span>
              <span className={`badge ${player.isReady ? "is-1" : ""}`}>
                {player.isReady ? t("common.ready") : t("common.waiting")}
              </span>
            </div>
          ))}
        </div>

        {!everyoneReady ? (
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            {t("lobby.allReadyHint", { min: MIN_PLAYERS_TO_START, max: MAX_PLAYERS_PER_ROOM })}
          </p>
        ) : null}

        {actionError ? <p className="banner is-error">{actionError}</p> : null}

        <div className="row" style={{ gap: 8 }}>
          {me ? (
            <button
              type="button"
              className={`btn ${me.isReady ? "btn-ghost" : "btn-success"}`}
              disabled={busy || !uid}
              onClick={() => uid && act(() => setReady(roomCode, !me.isReady))}
            >
              {me.isReady ? t("lobby.notReady") : t("lobby.imReady")}
            </button>
          ) : null}

          {isHost ? (
            <button
              type="button"
              className="btn btn-block"
              disabled={!canStart || (moduleSelectionMode === "MANUAL" && selectedModuleIds.length < players.length)}
              onClick={() => act(() => startGame(roomCode), onStart)}
            >
              {t("lobby.start")}
            </button>
          ) : (
            <p className="muted" style={{ margin: 0, alignSelf: "center" }}>
              {t("lobby.waitingHost")}
            </p>
          )}
        </div>

        <button
          type="button"
          className="btn btn-ghost"
          disabled={busy}
          onClick={() => act(() => leaveLobby(roomCode), onLeave)}
        >
          {t("common.leave")}
        </button>
      </div>
    </main>
  );
}
