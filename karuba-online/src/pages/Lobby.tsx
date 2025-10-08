import { useState } from "react"
import { getPlayerId } from "../lib/playerId"
import LobbyGameStep from "./LobbyGameStep"
import LobbyNameStep from "./LobbyNameStep"
import HowToPlayModal from "../components/HowToPlayModal"

export default function Lobby() {
  const [step, setStep] = useState<"game" | "name">("game")
  const [gameId, setGameId] = useState("")
  const [name, setName] = useState("")
  const [showHowToPlay, setShowHowToPlay] = useState(false)
  const playerId = getPlayerId(name)

  return (
    <main className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div className="page-inner" style={{
        width: 360,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <button
          className="font-display"
          onClick={() => setShowHowToPlay(true)}
          style={{
            width: '100%',
            marginBottom: 12,
            padding: '10px',
            fontSize: 18,
            borderRadius: 6,
            background: '#f8f9fa',
            border: '1px solid #dee2e6',
            color: '#495057',
            cursor: 'pointer'
          }}
        >
          How to Play
        </button>

        <div className="card" style={{
          padding: 24,
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          width: "100%"
        }}>
          {step === "game" && (
            <LobbyGameStep gameId={gameId} setGameId={setGameId} setStep={setStep} />
          )}

          {step === "name" && (
            <LobbyNameStep gameId={gameId} name={name} setName={setName} playerId={playerId} />
          )}
        </div>
      </div>

      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />
    </main>
  )
}
