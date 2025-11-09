export default function Home() {
  return (
    <main className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div className="page-inner" style={{
        width: 400,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
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
          <p style={{ margin: "0 0 32px 0", color: "#666", fontSize: "16px" }}>
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

          <div style={{ marginTop: "24px", padding: "16px", background: "#f8f9fa", borderRadius: "8px" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>How to Play:</h3>
            <ul style={{ margin: 0, paddingLeft: "20px", textAlign: "left", fontSize: "14px", color: "#666" }}>
              <li>Create or join a game</li>
              <li>Players join teams</li>
              <li>Tap score buttons to add points</li>
              <li>Voice announcements guide the game</li>
              <li>First to 11 points wins (win by 2)</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
