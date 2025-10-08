import React from "react"
import type { Game, Player } from "../lib/types"

interface ResultModalProps {
  game: Game
  players: Record<string, Player>
  showResult: boolean
  setShowResult: (show: boolean) => void
}

export default function ResultModal({ game, players, showResult, setShowResult }: ResultModalProps) {
  if (!showResult) return null

  const sorted = Object.values(players || {}).sort((a, b) => b.score - a.score)
  const myPos = Math.max(1, sorted.findIndex(p => p.id === (history.state as any)?.playerName) + 1)

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 12,
          width: 420,
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
        }}
      >
        <h2
          className="font-display"
          style={{ marginTop: 0, marginBottom: 12, textAlign: "center" }}
        >
          {myPos === 1
            ? "Victory! 🏆"
            : myPos === sorted.length
            ? "Game Over! ☠️"
            : "Game Result 🎲"}
        </h2>

        <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map((p, i) => {
            const rank = i + 1
            return (
              <div
                key={p.id}
                style={{
                  border: "1px solid rgba(0,0,0,0.1)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  background: "#fafafa",
                }}
              >
                <div style={{ fontWeight: p.id === (history.state as any)?.playerName ? 700 : 400 }}>
                  {`(#${rank}) | ${p.name} | ${p.score} pts`}
                  {rank === 1 ? " 👑" : ""}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: 12 }}>
          <button
            className="font-display"
            onClick={() => {
              setShowResult(false)
              history.pushState({}, "", "/")
              dispatchEvent(new PopStateEvent("popstate"))
            }}
          >
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  )
}
