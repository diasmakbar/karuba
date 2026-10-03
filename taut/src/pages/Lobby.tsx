import { useState } from "react";
import { useRoom } from "../hooks/useRoom";
import { useUid } from "../hooks/useUid";
import { MIN_PLAYERS_TO_START } from "../lib/gameConfig";
import { playerList, setReady, leaveLobby, startGame } from "../utils/room";

interface LobbyProps {
  roomCode: string;
  onStart: () => void;
  onLeave: () => void;
}

/** Pre-game lobby: share the code, ready up, host starts. Live-synced through Firebase. */
export function Lobby({ roomCode, onStart, onLeave }: LobbyProps) {
  const uid = useUid();
  const { room, loading, error, connected } = useRoom(roomCode);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
              disabled={!canStart}
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
