import { useEffect, useState } from "react";
import { db, ref, onValue } from "../firebase";
import type { RoomState } from "../types/db-schema";

export interface RoomSnapshot {
  room: RoomState | null;
  loading: boolean;
  error: string | null;
  connected: boolean;
}

/**
 * Live room subscription. Firebase is the only source of truth: every client reads the
 * same node and derives the countdown locally, so there is exactly one listener per client.
 */
export function useRoom(roomId: string | null): RoomSnapshot {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setRoom(null);
    setLoading(roomId !== null);
    setError(null);

    if (!roomId) return undefined;

    const unsubscribeRoom = onValue(
      ref(db, `games/taut/${roomId}`),
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setRoom({ lastStrike: null, ...data } as RoomState);
        } else {
          setRoom(null);
          setError("This room no longer exists.");
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Connection to the server was lost.");
        setLoading(false);
      },
    );

    const unsubscribeConn = onValue(ref(db, ".info/connected"), (snapshot) => {
      setConnected(snapshot.val() === true);
    });

    return () => {
      unsubscribeRoom();
      unsubscribeConn();
    };
  }, [roomId]);

  return { room, loading, error, connected };
}
