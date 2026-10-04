import { useState } from "react";
import type { Difficulty, ModuleId, ModuleSelectionMode } from "../types/db-schema";
import { useRoom } from "../hooks/useRoom";
import { useUid } from "../hooks/useUid";
import { DIFFICULTIES, DIFFICULTY_IDS, MIN_PLAYERS_TO_START } from "../lib/gameConfig";
import { ALL_MODULE_IDS, definitionById } from "../lib/modules";
import { playerList, setReady, setDifficulty, setAdvancedSettings, leaveLobby, startGame } from "../utils/room";

interface LobbyProps {
  roomCode: string;
  onStart: () => void;
  onLeave: () => void;
}

/** Pre-game lobby: share the code, pick difficulty, ready up, host starts. Live-synced via Firebase. */
export function Lobby({ roomCode, onStart, onLeave }: LobbyProps) {
  const uid = useUid();
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
        <p className="muted">Connecting to room {roomCode}…</p>
      </main>
    );
  }

  if (error || !room) {
    return (
      <main className="page page-center">
        <div className="card stack" style={{ maxWidth: 420 }}>
          <p className="banner is-error">{error ?? "Room not found."}</p>
          <button type="button" className="btn btn-block" onClick={onLeave}>
            Back to home
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
  const moduleSelectionMode: ModuleSelectionMode = room.moduleSelectionMode ?? "RANDOM";
  const selectedModuleIds: ModuleId[] = room.selectedModuleIds?.length ? room.selectedModuleIds : ALL_MODULE_IDS;
  const saveAdvanced = (next: Partial<{ timePerLevelSeconds: number; totalLevels: number; moduleSelectionMode: ModuleSelectionMode; selectedModuleIds: ModuleId[] }>) =>
    act(() => setAdvancedSettings(roomCode, {
      timePerLevelSeconds,
      totalLevels,
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
            <span className="tag">Room code</span>
            <span className="hud-value font-display">{roomCode}</span>
          </div>
          <button type="button" className="btn btn-ghost" onClick={copyCode}>
            {copied ? "Copied" : "Copy"}
          </button>
        </header>

        {!connected ? <p className="banner is-warn">Reconnecting…</p> : null}

        <div className="field">
          <span className="tag">Difficulty</span>
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
              <span>Advanced settings</span><span aria-hidden="true">{showAdvanced ? "−" : "+"}</span>
            </button>
            {showAdvanced ? (
              <div className="stack advanced-content">
                <div className="field">
                  <span className="tag">Time per phase</span>
                  <div className="row">
                    {[3, 5, 8, 10].map((minutes) => (
                      <button key={minutes} type="button" className={`chip ${timePerLevelSeconds === minutes * 60 ? "is-active" : ""}`} disabled={busy} onClick={() => void saveAdvanced({ timePerLevelSeconds: minutes * 60 })}>{minutes} min</button>
                    ))}
                  </div>
                  <div className="row">
                    <input aria-label="Custom minutes per phase" type="number" min={1} max={60} value={customTime} placeholder="Custom minutes (1–60)" onChange={(event) => setCustomTime(event.target.value)} />
                    <button type="button" className="btn btn-ghost" disabled={busy || !customTime || Number(customTime) < 1 || Number(customTime) > 60} onClick={() => void saveAdvanced({ timePerLevelSeconds: Math.round(Number(customTime) * 60) })}>Set time</button>
                  </div>
                  <span className="muted">Current: {Math.floor(timePerLevelSeconds / 60)} min</span>
                </div>

                <div className="field">
                  <span className="tag">Phases</span>
                  <div className="row">
                    {[1, 2].map((count) => (
                      <button key={count} type="button" className={`chip ${totalLevels === count ? "is-active" : ""}`} disabled={busy} onClick={() => void saveAdvanced({ totalLevels: count })}>{count} {count === 1 ? "phase" : "phases"}</button>
                    ))}
                  </div>
                  <div className="row">
                    <input aria-label="Custom phase count" type="number" min={1} max={10} value={customLevels} placeholder="Custom phases (1–10)" onChange={(event) => setCustomLevels(event.target.value)} />
                    <button type="button" className="btn btn-ghost" disabled={busy || !customLevels || Number(customLevels) < 1 || Number(customLevels) > 10} onClick={() => void saveAdvanced({ totalLevels: Math.floor(Number(customLevels)) })}>Set phases</button>
                  </div>
                  <span className="muted">Current: {totalLevels} {totalLevels === 1 ? "phase" : "phases"}</span>
                </div>

                <div className="field">
                  <span className="tag">Module selection</span>
                  <div className="chip-group">
                    {(["RANDOM", "MANUAL"] as const).map((mode) => (
                      <button key={mode} type="button" className={`chip ${moduleSelectionMode === mode ? "is-active" : ""}`} disabled={busy} onClick={() => void saveAdvanced({ moduleSelectionMode: mode })}>{mode === "RANDOM" ? "Random" : "Manual pool"}</button>
                    ))}
                  </div>
                  {moduleSelectionMode === "MANUAL" ? (
                    <>
                      <p className="muted" style={{ margin: 0, fontSize: 13 }}>Choose at least {players.length} modules so every player receives a different module.</p>
                      <div className="module-pool-grid">
                        {ALL_MODULE_IDS.map((id) => {
                          const checked = selectedModuleIds.includes(id);
                          const next = checked ? selectedModuleIds.filter((item) => item !== id) : [...selectedModuleIds, id];
                          return <label key={id} className="module-pool-option"><input type="checkbox" checked={checked} disabled={busy} onChange={() => void saveAdvanced({ selectedModuleIds: next })} /><span>{definitionById(id).name}</span></label>;
                        })}
                      </div>
                      <span className={selectedModuleIds.length < players.length ? "banner is-warn" : "muted"}>{selectedModuleIds.length} selected{selectedModuleIds.length < players.length ? ` — need ${players.length - selectedModuleIds.length} more` : ""}</span>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="stack" style={{ gap: 6 }}>
          <span className="tag">
            Players ({players.length}) · minimum {MIN_PLAYERS_TO_START}
          </span>
          {players.map((player) => (
            <div key={player.id} className="player-row">
              <span>
                {player.name}
                {player.id === room.hostId ? " · host" : ""}
                {player.id === uid ? " (you)" : ""}
              </span>
              <span className={`badge ${player.isReady ? "is-1" : ""}`}>
                {player.isReady ? "Ready" : "Waiting"}
              </span>
            </div>
          ))}
        </div>

        {!everyoneReady ? (
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            Everyone must be ready, with at least {MIN_PLAYERS_TO_START} players, to start.
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
              {me.isReady ? "Not ready" : "I'm ready"}
            </button>
          ) : null}

          {isHost ? (
            <button
              type="button"
              className="btn btn-block"
              disabled={!canStart || (moduleSelectionMode === "MANUAL" && selectedModuleIds.length < players.length)}
              onClick={() => act(() => startGame(roomCode), onStart)}
            >
              Start game
            </button>
          ) : (
            <p className="muted" style={{ margin: 0, alignSelf: "center" }}>
              Waiting for the host to start…
            </p>
          )}
        </div>

        <button
          type="button"
          className="btn btn-ghost"
          disabled={busy}
          onClick={() => act(() => leaveLobby(roomCode), onLeave)}
        >
          Leave
        </button>
      </div>
    </main>
  );
}
