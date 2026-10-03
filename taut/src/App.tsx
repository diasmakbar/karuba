import { useCallback, useEffect, useState } from "react";
import { Home } from "./pages/Home";
import { Lobby } from "./pages/Lobby";
import { Room } from "./pages/Room";
import { ModuleSandbox } from "./pages/ModuleSandbox";

type Screen = "HOME" | "LOBBY" | "ROOM";

const ROOM_KEY = "taut.room";

/** `?dev=modules` opens the in-memory module sandbox instead of the normal flow. */
function isDevSandbox(): boolean {
  return new URLSearchParams(window.location.search).get("dev") === "modules";
}

/**
 * Tiny screen state machine — no router needed for a three-screen game (plan §4.1).
 * The active room code is persisted so a refresh drops the player back into their room.
 */
export default function App() {
  const [screen, setScreen] = useState<Screen>(() => (readRoom() ? "LOBBY" : "HOME"));
  const [roomCode, setRoomCode] = useState<string | null>(() => readRoom());
  const [dev, setDev] = useState(() => isDevSandbox());

  useEffect(() => {
    if (roomCode) window.localStorage.setItem(ROOM_KEY, roomCode);
    else window.localStorage.removeItem(ROOM_KEY);
  }, [roomCode]);

  const enterRoom = useCallback((code: string) => {
    setRoomCode(code);
    setScreen("LOBBY");
  }, []);

  const enterGame = useCallback(() => setScreen("ROOM"), []);
  const backToLobby = useCallback(() => setScreen("LOBBY"), []);
  const leave = useCallback(() => {
    setRoomCode(null);
    setScreen("HOME");
  }, []);

  const exitDev = useCallback(() => {
    window.history.replaceState(null, "", window.location.pathname);
    setDev(false);
  }, []);

  if (dev) {
    return <ModuleSandbox onExit={exitDev} />;
  }
  if (screen === "HOME" || !roomCode) {
    return <Home onEnterRoom={enterRoom} onOpenDev={() => setDev(true)} />;
  }
  if (screen === "ROOM") {
    return <Room roomCode={roomCode} onLeave={leave} onBackToLobby={backToLobby} />;
  }
  return <Lobby roomCode={roomCode} onStart={enterGame} onLeave={leave} />;
}

function readRoom(): string | null {
  return window.localStorage.getItem(ROOM_KEY);
}
