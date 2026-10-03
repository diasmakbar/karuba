import { useState } from "react";
import { MAX_ROOM_NAME_LENGTH } from "../lib/gameConfig";
import { createRoom, joinRoom } from "../utils/room";

interface HomeProps {
  onEnterRoom: (code: string) => void;
  /** Dev-only: open the in-memory module sandbox. */
  onOpenDev?: () => void;
}

/** Landing screen: name, create a room, or join by 6-digit code. Difficulty is chosen in the lobby. */
export function Home({ onEnterRoom, onOpenDev }: HomeProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<string>) => {
    setBusy(true);
    setError(null);
    try {
      onEnterRoom(await action());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const canCreate = name.trim().length > 0 && !busy;
  const canJoin = name.trim().length > 0 && code.replace(/\D/g, "").length === 6 && !busy;

  return (
    <main className="page page-center">
      <div className="card stack" style={{ maxWidth: 460, width: "100%" }}>
        <header className="stack" style={{ gap: 4 }}>
          <h1 className="font-display" style={{ margin: 0 }}>
            TAUT SPACE
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            Everyone has a problem. Everyone holds part of someone else's solution.
          </p>
        </header>

        <label className="field">
          <span className="tag">Your name</span>
          <input
            type="text"
            value={name}
            maxLength={MAX_ROOM_NAME_LENGTH}
            placeholder="Operative"
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <button
          type="button"
          className="btn btn-block"
          disabled={!canCreate}
          onClick={() => run(() => createRoom(name))}
        >
          Create room
        </button>

        <div className="row" style={{ gap: 8 }}>
          <input
            type="text"
            inputMode="numeric"
            value={code}
            maxLength={6}
            placeholder="Room code"
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          />
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!canJoin}
            onClick={() => run(() => joinRoom(code, name))}
          >
            Join
          </button>
        </div>

        {error ? <p className="banner is-error">{error}</p> : null}
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>
          Rooms need 3–6 players, all on separate devices.
        </p>
        {onOpenDev ? (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ fontSize: 12 }}
            onClick={onOpenDev}
          >
            Dev: test modules
          </button>
        ) : null}
      </div>
    </main>
  );
}
