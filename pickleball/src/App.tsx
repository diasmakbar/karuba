import { useEffect, useState } from "react"
import Home from "./pages/Home"
import CreateGame from "./pages/CreateGame"
import JoinGame from "./pages/JoinGame"
import Setup from "./pages/Setup"
import Game from "./pages/Game"
import "./styles.css"

function App() {
  const [path, setPath] = useState(location.pathname)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    // make sure viewport meta exists for mobile
    let meta = document.querySelector('meta[name="viewport"]')
    if (!meta) {
      meta = document.createElement("meta")
      meta.setAttribute("name", "viewport")
      meta.setAttribute("content", "width=device-width, initial-scale=1, viewport-fit=cover")
      document.head.appendChild(meta)
    }

    // Apply theme to document
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
    localStorage.setItem('theme', JSON.stringify(isDarkMode))

    const onPop = () => setPath(location.pathname)
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [isDarkMode])

  if (path.startsWith("/setup/")) {
    const gameId = path.split("/").pop()!
    return <Setup gameId={gameId} />
  }

  if (path.startsWith("/game/")) {
    const gameId = path.split("/").pop()!
    return <Game gameId={gameId} isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode(!isDarkMode)} />
  }

  if (path === "/create") {
    return <CreateGame />
  }

  if (path === "/join") {
    return <JoinGame />
  }

  return <Home />
}

export default App
