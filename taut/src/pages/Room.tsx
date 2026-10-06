import { useEffect, useMemo, useRef, useState } from "react";
import { HUD } from "../components/HUD";
import { InfoPanel } from "../components/InfoPanel";
import { ResultModal } from "../components/ResultModal";
import { ModuleConsole } from "../components/modules/registry";
import { useRoom } from "../hooks/useRoom";
import { useUid } from "../hooks/useUid";
import { useCountdown } from "../hooks/useCountdown";
import { definitionById } from "../lib/modules";
import { runInfo } from "../lib/modules/contract";
import type { AnyModuleState, LocalVarsMap, ModuleAnswerMap, ModuleId, PlayerState } from "../types/db-schema";
import { asRecord, playerList, advanceLevel, resetToLobby } from "../utils/room";
import { expireRoom, patchModuleVars, solvedModules, submitModuleAnswer, totalModules } from "../utils/game";

interface RoomProps {
  roomCode: string;
  onLeave: () => void;
  onBackToLobby: () => void;
}

/** In-game screen: HUD, the owner's single module, and the manual pages they hold for others. */
export function Room({ roomCode, onLeave, onBackToLobby }: RoomProps) {
  const uid = useUid();
  const { room, loading, error, connected } = useRoom(roomCode);
  const countdown = useCountdown(room?.globalEndTime ?? null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const expiredRef = useRef(false);

  // First client to hit zero closes the level; idempotent on every other client.
  useEffect(() => {
    if (!room || room.status !== "PLAYING") return;
    if (countdown.expired && !expiredRef.current) {
      expiredRef.current = true;
      expireRoom(roomCode).catch(() => undefined);
    }
    if (!countdown.expired) expiredRef.current = false;
  }, [room, countdown.expired, roomCode]);

  const players = useMemo(() => (room ? playerList(room) : []), [room]);
  const me: PlayerState | undefined = room && uid ? room.players?.[uid] : undefined;

  const myModule: AnyModuleState | undefined = me ? Object.values(asRecord<AnyModuleState>(me.activeModules))[0] : undefined;
  const isHost = room?.hostId === uid;

  // Informant pages: every module I hold a page for. In MVP each player owns one module, so the
  // pages I hold are the modules owned by the players who list me as their informant.
  const infoPages = useMemo(() => {
    if (!room || !uid) return [];
    const pages: { moduleName: string; ownerName: string; page: 1 | 2; tables: ReturnType<typeof runInfo> }[] = [];
    for (const owner of players) {
      if (owner.id === uid) continue;
      const owned = Object.values(asRecord<AnyModuleState>(owner.activeModules));
      const moduleState = owned[0];
      if (!moduleState) continue;
      const definition = definitionById(moduleState.moduleId);
      if (owner.informant1Id === uid) {
        pages.push({ moduleName: definition.name, ownerName: owner.name, page: 1, tables: runInfo("info1", definition, moduleState.localVars) });
      }
      if (owner.informant2Id === uid) {
        pages.push({ moduleName: definition.name, ownerName: owner.name, page: 2, tables: runInfo("info2", definition, moduleState.localVars) });
      }
    }
    return pages;
  }, [room, uid, players]);

  if (loading) {
    return (
      <main className="page page-center">
        <p className="muted">Entering the room…</p>
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

  if (room.status === "LOBBY") {
    onBackToLobby();
    return null;
  }

  const solved = solvedModules(players);
  const total = totalModules(players);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const submit = (answer: ModuleAnswerMap[ModuleId]) => {
    if (!me || !myModule) return Promise.reject(new Error("No module to solve."));
    return submitModuleAnswer(roomCode, me.id, myModule, answer);
  };

  const patch = (vars: LocalVarsMap[ModuleId]) => {
    if (!me || !myModule) return Promise.resolve();
    return patchModuleVars(roomCode, me.id, myModule, vars);
  };

  const informantNames = me
    ? [me.informant1Id, me.informant2Id].map((id) => room.players?.[id]?.name ?? "—")
    : [];

  return (
    <main className="page">
      <HUD
        room={room}
        countdown={countdown}
        connected={connected}
        solved={solved}
        total={total}
        onLeave={onLeave}
      />

      <div className="stack" style={{ marginTop: 16, gap: 20 }}>
        {actionError ? <p className="banner is-error">{actionError}</p> : null}

        <section className="stack" style={{ gap: 6 }}>
          <span className="tag">Your module</span>
          {myModule ? (
            <div className="module-grid">
              <ModuleConsole
                state={myModule}
                disabled={room.status !== "PLAYING"}
                submit={submit}
                patch={patch}
                secondsLeft={countdown.secondsLeft}
                difficulty={room.difficulty}
              />
            </div>
          ) : (
            <p className="muted">No module assigned.</p>
          )}
          {informantNames.length === 2 ? (
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Info 1 from <strong>{informantNames[0]}</strong> · Info 2 from <strong>{informantNames[1]}</strong>
            </p>
          ) : null}
        </section>

        <section className="stack" style={{ gap: 10 }}>
          <span className="tag">Manual pages you hold ({infoPages.length})</span>
          {infoPages.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              Nobody is relying on you this round.
            </p>
          ) : (
            <div className="info-section">
              {infoPages.map((page) => (
                <InfoPanel
                  key={`${page.ownerName}-${page.page}`}
                  moduleName={page.moduleName}
                  ownerName={page.ownerName}
                  page={page.page}
                  tables={page.tables}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {room.status === "LEVEL_CLEARED" ? (
        <div className="modal-backdrop">
          <div className="card stack" style={{ maxWidth: 420, width: "100%" }}>
            <h2 className="font-display" style={{ margin: 0 }}>
              Level {room.level} cleared
            </h2>
            <p className="muted" style={{ margin: 0 }}>
              {room.level} of {room.totalLevels} done. New modules and new informants next.
            </p>
            {isHost ? (
              <button
                type="button"
                className="btn btn-block"
                disabled={busy}
                onClick={() => run(() => advanceLevel(roomCode))}
              >
                Start level {room.level + 1}
              </button>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                Waiting for the host…
              </p>
            )}
          </div>
        </div>
      ) : null}

      {room.status === "VICTORY" || room.status === "GAME_OVER" ? (
        <ResultModal
          room={room}
          isHost={Boolean(isHost)}
          busy={busy}
          onPlayAgain={() => run(() => resetToLobby(roomCode))}
          onLeave={onLeave}
        />
      ) : null}
    </main>
  );
}
