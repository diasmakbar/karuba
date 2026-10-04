import { useCallback, useEffect, useState } from "react";
import { Home, NameStep } from "./pages/Home";
import { Lobby } from "./pages/Lobby";
import { Room } from "./pages/Room";
import { ModuleSandbox } from "./pages/ModuleSandbox";

type Screen = "HOME" | "NAME" | "LOBBY" | "ROOM";
type EntryIntent = { kind: "CREATE" } | { kind: "JOIN"; code: string };

const ROOM_KEY = "taut.room";

/** The dev sandbox lives on its own route: `<host>/dev_test`. */
const DEV_TEST_PATH = "/dev_test";

/** True when the current URL path targets the standalone dev-test page. */
function isDevTestRoute(): boolean {
  const path = window.location.pathname.replace(/\/+$/, "");
  return path === DEV_TEST_PATH;
}

/**
 * Tiny screen state machine — no router needed for a three-screen game (plan §4.1).
 * The active room code is persisted so a refresh drops the player back into their room.
 * The dev module sandbox is a dedicated route (`/dev_test`), fully separate from the
 * production flow, which stays clean.
 */
export default function App() {
  const [screen, setScreen] = useState<Screen>(() => (readRoom() ? "LOBBY" : "HOME"));
  const [roomCode, setRoomCode] = useState<string | null>(() => readRoom());
  const [entryIntent, setEntryIntent] = useState<EntryIntent | null>(null);
  const [isDevTest, setIsDevTest] = useState(() => isDevTestRoute());

  useEffect(() => {
    if (roomCode) window.localStorage.setItem(ROOM_KEY, roomCode);
    else window.localStorage.removeItem(ROOM_KEY);
  }, [roomCode]);

  const chooseEntryIntent = useCallback((intent: EntryIntent) => {
    setEntryIntent(intent);
    setScreen("NAME");
  }, []);

  const enterRoom = useCallback((code: string) => {
    setRoomCode(code);
    setEntryIntent(null);
    setScreen("LOBBY");
  }, []);

  const enterGame = useCallback(() => setScreen("ROOM"), []);
  const backToLobby = useCallback(() => setScreen("LOBBY"), []);
  const leave = useCallback(() => {
    setRoomCode(null);
    setScreen("HOME");
  }, []);

  /** Leave the dev route by navigating back to the root path. */
  const exitDevTest = useCallback(() => {
    window.history.replaceState(null, "", "/");
    setIsDevTest(false);
  }, []);

  if (isDevTest) {
    return <ModuleSandbox onExit={exitDevTest} />;
  }
  if (screen === "HOME" || !roomCode && screen !== "NAME") {
    return <Home onChooseIntent={chooseEntryIntent} />;
  }
  if (screen === "NAME" && entryIntent) {
    return <NameStep intent={entryIntent} onBack={() => setScreen("HOME")} onEnterRoom={enterRoom} />;
  }
  if (screen === "ROOM") {
    return <Room roomCode={roomCode!} onLeave={leave} onBackToLobby={backToLobby} />;
  }
  return <Lobby roomCode={roomCode!} onStart={enterGame} onLeave={leave} />;
}

function readRoom(): string | null {
  return window.localStorage.getItem(ROOM_KEY);
}
