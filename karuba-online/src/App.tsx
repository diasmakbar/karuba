import { useEffect, useState } from "react"
import Lobby from "./pages/Lobby"
import Room from "./pages/Room"

export default function App() {
  const [path, setPath] = useState(location.pathname)

  useEffect(() => {
    const onPop = () => setPath(location.pathname)
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  if (path.startsWith("/room/")) {
    const gameId = path.split("/").pop()!
    return <Room gameId={gameId} />
  }

  return <Lobby />
}
