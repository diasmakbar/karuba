import { useState } from "react";
import type { Difficulty } from "../types/db-schema";
import { DIFFICULTIES, DIFFICULTY_IDS, MAX_ROOM_NAME_LENGTH } from "../lib/gameConfig";
import { createRoom, joinRoom } from "../utils/room";

interface HomeProps {
  onEnterRoom: (code: string) => void;
}

/** Entry screen: name, difficulty, create a room, or join by 6-digit code. */
export function Home({ onEnterRoom }: HomeProps) {
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("STANDARD");
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

        <div className="field">
          <span className="tag">Difficulty</span>
          <div className="chip-group">
            {DIFFICULTY_IDS.map((id) => (
              <button
                key={id}
                type="button"
                className={`chip ${difficulty === id ? "is-active" : ""}`}
                onClick={() => setDifficulty(id)}
              >
                {DIFFICULTIES[id].label}
              </button>
            ))}
          </div>
          <p className="muted" style={{ margin: "6px 0 0", fontSize: 13 }}>
            {DIFFICULTIES[difficulty].blurb}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-block"
          disabled={!canCreate}
          onClick={() => run(() => createRoom(name, difficulty))}
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
      </div>
    </main>
  );
}
