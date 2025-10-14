import React, { useState } from "react"
import type { Game, Player } from "../lib/types"

interface ResultModalProps {
  game: Game
  players: Record<string, Player>
  showResult: boolean
  setShowResult: (show: boolean) => void
}

export default function ResultModal({ game, players, showResult, setShowResult }: ResultModalProps) {
  if (!showResult) return null

  // const sorted = Object.values(players || {}).sort((a, b) => b.score - a.score)
  // const myPos = Math.max(1, sorted.findIndex(p => p.id === (history.state as any)?.playerName) + 1)
  
  const myId = (history.state as any)?.playerName;

  const sorted = Object.values(players || {})
    .map(p => ({
      ...p,
      score: p.score ?? 0
    }))
    .sort((a, b) => b.score - a.score);

  // const myPos = sorted.findIndex(p => p.id === myId) + 1 || sorted.length;
  const myIndex = sorted.findIndex(p => p.id === myId || p.name === myId);
  const myPos = myIndex >= 0 ? myIndex + 1 : sorted.length;

  
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null)

  const getOrdinalSuffix = (num: number) => {
    if (num === 1) return "1st"
    if (num === 2) return "2nd"
    if (num === 3) return "3rd"
    return `${num}th`
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🏆"
    if (rank === sorted.length) return "💀"
    return "🎲"
  }

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
          maxWidth: "90vw",
          width: "500px",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ position: "relative", textAlign: "center", marginBottom: 16 }}>
          <h2
            className="font-display"
            style={{ margin: 0 }}
          >
            {(() => {
              if (myPos === 1) return "Victory! 🏆";
              if (myPos === 2) return "2nd Place! 🥈";
              if (myPos === 3) return "3rd Place! 🥉";
              if (myPos > 3 && myPos < sorted.length) return "Game Result 🎲";
              if (myPos === sorted.length) return "Game Over ☠️";
              return "Game Result 🎲";
            })()}
          </h2>
          <button
            onClick={() => setShowResult(false)}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#666",
              padding: "4px",
              borderRadius: "4px",
            }}
            title="Close"
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map((p, i) => {
            const rank = i + 1
            // const isMe = p.id === (history.state as any)?.playerName
            const isMe = p.id === myId || p.name === myId || p.playerName === myId;
            // const highlightStyle = isMe
            //   ? { position: "relative", zIndex: 10, backgroundColor: "rgba(255,235,59,0.25)" }
            //   : {};
            const highlightStyle = isMe
              ? {
                  position: "relative",
                  zIndex: 999,
                  isolation: "isolate",
                  backgroundColor: "rgba(255, 235, 59, 0.35)",
                  boxShadow: "0 0 0 3px rgba(255, 235, 59, 0.5) inset",
                  border: "2px solid rgba(255, 235, 59, 0.4)",
                  transition: "background-color 0.3s ease, box-shadow 0.3s ease"
                }
              : {};

            const winsArr = (game.templeWins || []) as any[]
            const playerWins = winsArr.filter((w: any) => w.playerId === p.id)
            const nPlayers = sorted.length

            // 🧮 Group finishing orders
            const groupedWins: Record<number, number> = {}
            playerWins.forEach((win: any) => {
              groupedWins[win.order] = (groupedWins[win.order] || 0) + 1
            })
            const sortedOrders = Object.entries(groupedWins)
              .map(([order, count]) => ({ order: Number(order), count }))
              .sort((a, b) => a.order - b.order)

            return (
              <div key={p.id} style={{ marginBottom: 8 }}>
                {/* HEADER BAR */}
                <div
                  style={{
                      padding: "12px 16px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      background: isMe ? "#fff3cd" : "#ffffff",
                      border: isMe ? "2px solid #ffec99" : "1px solid #e5e7eb",
                      position: "relative",
                      zIndex: isMe ? 1 : 0,
                      WebkitTapHighlightColor: "transparent",
                      fontWeight: isMe ? 700 : 400,
                  }}
                  onClick={() => setExpandedPlayer(expandedPlayer === p.id ? null : p.id)}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div>{getRankIcon(rank)}</div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 2fr 1fr",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <div style={{ textAlign: "left" }}>{getOrdinalSuffix(rank)}</div>
                      <div style={{ textAlign: "center" }}>{p.name}</div>
                      <div style={{ textAlign: "right" }}>{p.score} pts</div>
                    </div>
                    <div style={{ fontSize: "12px", opacity: 0.7 }}>
                      {expandedPlayer === p.id ? "▽" : "◁"}
                    </div>
                  </div>
                </div>

                {/* EXPANDED DETAIL */}
                {expandedPlayer === p.id && (
                  <div
                    style={{
                      marginTop: "6px",
                      padding: "14px 16px",
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px",
                      lineHeight: 1.6,
                    }}
                  >
                    {/* Finishing Order */}
                    <div style={{ marginBottom: "10px" }}>
                      <div style={{ fontWeight: 600, marginBottom: "4px" }}>Finishing Order</div>
                      {sortedOrders.length === 0 ? (
                        <div style={{ color: "#888" }}>Unfinished (0 pts)</div>
                      ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", }}>
                          <colgroup>
                            <col style={{ width: "70%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "20%" }} />
                          </colgroup>
                          <tbody>
                            {sortedOrders.map(({ order, count }) => {
                              const pointsEach = Math.max(0, nPlayers + 2 - order)
                              const totalPoints = pointsEach * count
                              return (
                                <tr key={order}>
                                  <td>• Finishing {getOrdinalSuffix(order)}</td>
                                  <td style={{ textAlign: "center" }}>{count}x</td>
                                  <td style={{ textAlign: "right" }}>{totalPoints} pts</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Rewards */}
                    <div style={{ marginBottom: "10px" }}>
                      <div style={{ fontWeight: 600, marginBottom: "4px" }}>Rewards</div>
                      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", }}>
                        <colgroup>
                          <col style={{ width: "70%" }} />
                          <col style={{ width: "10%" }} />
                          <col style={{ width: "20%" }} />
                        </colgroup>
                        <tbody>
                          <tr>
                            <td>• Gold</td>
                            <td style={{ textAlign: "center" }}>{(p as any).goldCount || 0}×</td>
                            <td style={{ textAlign: "right" }}>
                              {((p as any).goldCount || 0) * 2} pts
                            </td>
                          </tr>
                          <tr>
                            <td>• Crystal</td>
                            <td style={{ textAlign: "center" }}>
                              {(p as any).crystalCount || 0}×
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {(p as any).crystalCount || 0} pts
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Finish Bonus */}
                    {p.finishedAtRound && (
                      <div style={{ marginBottom: "10px" }}>
                        <div style={{ fontWeight: 600, marginBottom: "4px" }}>Finish Bonus</div>
                        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", }}>
                          <colgroup>
                            <col style={{ width: "70%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "20%" }} />
                          </colgroup>
                          <tbody>
                            <tr>
                              <td>• Finished at Round {p.finishedAtRound}/36</td>
                              <td style={{ textAlign: "center" }}>
                                {(p as any).baseBonus || 0}×
                              </td>
                              <td style={{ textAlign: "right" }}>
                                {(p as any).baseBonus || 0} pts
                              </td>
                            </tr>
                            <tr>
                              <td>• Finished as {getOrdinalSuffix(rank)} place</td>
                              <td style={{ textAlign: "center" }}>
                                {(p as any).placementBonus || 0}×
                              </td>
                              <td style={{ textAlign: "right" }}>
                                {(p as any).placementBonus || 0} pts
                              </td>
                            </tr>
                            <tr>
                              <td>Total Bonus</td>
                              <td style={{ textAlign: "center" }}></td>
                              <td style={{ textAlign: "right" }}>
                                {p.bonusPoints || 0} pts
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button
            className="font-display"
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
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
