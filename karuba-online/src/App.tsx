import { useEffect, useState } from "react"
import Lobby from "./pages/Lobby"
import Room from "./pages/Room"
import "./styles.css"

export default function App() {
  const [path, setPath] = useState(location.pathname)

  useEffect(() => {
    // make sure viewport meta exists for mobile
    let meta = document.querySelector('meta[name="viewport"]')
    if (!meta) {
      meta = document.createElement("meta")
      meta.setAttribute("name", "viewport")
      meta.setAttribute("content", "width=device-width, initial-scale=1, viewport-fit=cover")
      document.head.appendChild(meta)
    }
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