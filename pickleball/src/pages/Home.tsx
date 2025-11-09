export default function Home({ isDarkMode, onToggleTheme }: { isDarkMode: boolean; onToggleTheme: () => void }) {
  return (
    <main className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div className="page-inner" style={{
        width: 400,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ position: "absolute", top: "20px", right: "20px" }}>
          <button
            onClick={onToggleTheme}
            style={{
              padding: "8px 12px",
              background: isDarkMode ? "#333" : "#f8f9fa",
              color: isDarkMode ? "white" : "#333",
              border: "1px solid #ddd",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            {isDarkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>

        <div className="card" style={{
          padding: 32,
          borderRadius: 16,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          width: "100%",
          textAlign: "center"
        }}>
          <h1 style={{ margin: "0 0 8px 0", fontSize: "32px" }} className="font-display">
            🏓 Pickleball Scorer
          </h1>
          <p style={{ margin: "0 0 32px 0", color: "var(--text-secondary)", fontSize: "16px" }}>
            Real-time multiplayer pickleball scoring with voice announcements
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <button
              onClick={() => {
                window.history.pushState({}, "", "/create")
                window.dispatchEvent(new PopStateEvent("popstate"))
              }}
              style={{
                width: "100%",
                padding: "16px",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "18px",
                fontWeight: 500,
                cursor: "pointer"
              }}
            >
              Create New Game
            </button>

            <button
              onClick={() => {
                window.history.pushState({}, "", "/join")
                window.dispatchEvent(new PopStateEvent("popstate"))
              }}
              style={{
                width: "100%",
                padding: "16px",
                background: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "18px",
                fontWeight: 500,
                cursor: "pointer"
              }}
            >
              Join Existing Game
            </button>
          </div>

          <div style={{ marginTop: "24px", padding: "16px", borderRadius: "8px" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "var(--text-primary)" }}>How to Play:</h3>
            <ul style={{ margin: 0, paddingLeft: "20px", textAlign: "left", fontSize: "14px", color: "var(--text-secondary)" }}>
              <li>Create or join a game</li>
              <li>Players join teams</li>
              <li>Tap score buttons to add points</li>
              <li>Voice announcements guide the game</li>
              <li>First to 11 points wins</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
