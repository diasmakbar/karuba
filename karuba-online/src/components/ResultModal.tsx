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

  const sorted = Object.values(players || {}).sort((a, b) => b.score - a.score)
  const myPos = Math.max(1, sorted.findIndex(p => p.id === (history.state as any)?.playerName) + 1)
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
          width: 500,
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
        }}
      >
        <h2
          className="font-display"
          style={{ marginTop: 0, marginBottom: 16, textAlign: "center" }}
        >
          {myPos === 1
            ? "Victory! 🏆"
            : myPos === sorted.length
            ? "Game Over! ☠️"
            : "Game Result 🎲"}
        </h2>

        <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map((p, i) => {
            const rank = i + 1
            const isMe = p.id === (history.state as any)?.playerName
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
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    cursor: "pointer",
                    background: isMe ? "#fff3cd" : "#ffffff",
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
                      {expandedPlayer === p.id ? "⤵" : "↩"}
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
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <tbody>
                            {sortedOrders.map(({ order, count }) => {
                              const pointsEach = Math.max(0, nPlayers + 2 - order)
                              const totalPoints = pointsEach * count
                              return (
                                <tr key={order}>
                                  <td>• Finishing {getOrdinalSuffix(order)}</td>
                                  <td style={{ textAlign: "center" }}>×{count}</td>
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
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <tbody>
                            <tr>
                              <td>• Base Bonus (Round {p.finishedAtRound}/36)</td>
                              <td style={{ textAlign: "center" }}>
                                {(p as any).baseBonus || 0}×
                              </td>
                              <td style={{ textAlign: "right" }}>
                                {(p as any).baseBonus || 0} pts
                              </td>
                            </tr>
                            <tr>
                              <td>• Placement Bonus ({getOrdinalSuffix(rank)} place)</td>
                              <td style={{ textAlign: "center" }}>
                                {(p as any).placementBonus || 0}×
                              </td>
                              <td style={{ textAlign: "right" }}>
                                {(p as any).placementBonus || 0} pts
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Total Bonus */}
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: "4px" }}>Total Bonus</div>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <tbody>
                          <tr>
                            <td></td>
                            <td style={{ textAlign: "center" }}>{p.bonusPoints || 0}×</td>
                            <td style={{ textAlign: "right" }}>
                              <strong>{p.bonusPoints || 0} pts</strong>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
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


// import React, { useState } from "react"
// import type { Game, Player } from "../lib/types"

// interface ResultModalProps {
//   game: Game
//   players: Record<string, Player>
//   showResult: boolean
//   setShowResult: (show: boolean) => void
// }

// export default function ResultModal({ game, players, showResult, setShowResult }: ResultModalProps) {
//   if (!showResult) return null

//   const sorted = Object.values(players || {}).sort((a, b) => b.score - a.score)
//   const myPos = Math.max(1, sorted.findIndex(p => p.id === (history.state as any)?.playerName) + 1)
//   const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null)

//   const getOrdinalSuffix = (num: number) => {
//     if (num === 1) return "1st"
//     if (num === 2) return "2nd"
//     if (num === 3) return "3rd"
//     return `${num}th`
//   }

//   const getRankIcon = (rank: number) => {
//     if (rank === 1) return "🏆"
//     if (rank === sorted.length) return "💀"
//     return "🎲"
//   }

//   return (
//     <div
//       style={{
//         position: "fixed",
//         inset: 0,
//         background: "rgba(0,0,0,0.6)",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         zIndex: 1200,
//       }}
//     >
//       <div
//         style={{
//           background: "#fff",
//           padding: 20,
//           borderRadius: 12,
//           width: 500,
//           maxHeight: "80vh",
//           overflowY: "auto",
//           boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
//         }}
//       >
//         <h2
//           className="font-display"
//           style={{ marginTop: 0, marginBottom: 16, textAlign: "center" }}
//         >
//           {myPos === 1
//             ? "Victory! 🏆"
//             : myPos === sorted.length
//             ? "Game Over! ☠️"
//             : "Game Result 🎲"}
//         </h2>

//         <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
//           {sorted.map((p, i) => {
//             const rank = i + 1
//             const isMe = p.id === (history.state as any)?.playerName
//             const winsArr = (game.templeWins || []) as any[]
//             const playerWins = winsArr.filter((w: any) => w.playerId === p.id)
//             const nPlayers = sorted.length

//             return (
//               <div key={p.id} style={{ marginBottom: 8 }}>
//                 <div
//                   style={{
//                     padding: "12px 16px",
//                     border: "1px solid #e5e7eb",
//                     borderRadius: "8px",
//                     cursor: "pointer",
//                     background: isMe ? "#fff3cd" : "#ffffff",
//                     fontWeight: isMe ? 700 : 400
//                   }}
//                   onClick={() => setExpandedPlayer(expandedPlayer === p.id ? null : p.id)}
//                 >
//                   <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//                     <span>{getRankIcon(rank)}</span>
//                     <span style={{ flex: 1 }}>
//                       {getOrdinalSuffix(rank)} | {p.name} | {p.score} pts
//                     </span>
//                     <span style={{ fontSize: "12px", opacity: 0.7 }}>
//                       {expandedPlayer === p.id ? "⤵" : "↩"}
//                     </span>
//                   </div>
//                 </div>

//                 {expandedPlayer === p.id && (
//                   <div style={{
//                     marginTop: "4px",
//                     padding: "16px",
//                     background: "#f8f9fa",
//                     border: "1px solid #e5e7eb",
//                     borderRadius: "6px",
//                     borderTop: "none"
//                   }}>
//                     <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
//                       <div style={{ marginBottom: "12px", fontWeight: "bold", fontSize: "16px" }}>
//                         {getOrdinalSuffix(rank)} | {p.name} | {p.score} pts
//                       </div>

//                       <div style={{ marginBottom: "12px" }}>
//                         <strong>Finishing Order:</strong>
//                       </div>
//                       <div style={{ marginLeft: "8px", marginBottom: "12px" }}>
//                         {playerWins.length === 0 ? (
//                           <div>• Unfinished: 4 0 pts</div>
//                         ) : (
//                           <div style={{
//                             display: "grid",
//                             gridTemplateColumns: "auto 1fr auto auto",
//                             gap: "8px",
//                             alignItems: "center"
//                           }}>
//                             {playerWins
//                               .sort((a: any, b: any) => a.order - b.order)
//                               .map((win: any, i: number) => {
//                                 const points = Math.max(0, nPlayers + 2 - win.order)
//                                 return (
//                                   <React.Fragment key={i}>
//                                     <div style={{ textAlign: "left" }}>Finishing {getOrdinalSuffix(win.order)}</div>
//                                     <div style={{ textAlign: "center" }}>1×</div>
//                                     <div style={{ textAlign: "right" }}>{points} pts</div>
//                                   </React.Fragment>
//                                 )
//                               })}
//                           </div>
//                         )}
//                       </div>

//                       <div style={{ marginBottom: "12px" }}>
//                         <strong>Rewards:</strong>
//                       </div>
//                       <div style={{ marginLeft: "8px", marginBottom: "12px" }}>
//                         <div style={{
//                           display: "grid",
//                           gridTemplateColumns: "auto 1fr auto auto",
//                           gap: "8px",
//                           alignItems: "center"
//                         }}>
//                           <div style={{ textAlign: "left" }}>• Gold:</div>
//                           <div style={{ textAlign: "center" }}>{(p as any).goldCount || 0}×</div>
//                           <div style={{ textAlign: "right" }}>{((p as any).goldCount || 0) * 2} pts</div>
//                         </div>
//                         <div style={{
//                           display: "grid",
//                           gridTemplateColumns: "auto 1fr auto auto",
//                           gap: "8px",
//                           alignItems: "center"
//                         }}>
//                           <div style={{ textAlign: "left" }}>• Crystal:</div>
//                           <div style={{ textAlign: "center" }}>{(p as any).crystalCount || 0}×</div>
//                           <div style={{ textAlign: "right" }}>{(p as any).crystalCount || 0} pts</div>
//                         </div>
//                       </div>

//                       {p.finishedAtRound && (
//                         <div style={{ marginBottom: "12px" }}>
//                           <strong>Finished at:</strong>
//                           <div style={{
//                             display: "grid",
//                             gridTemplateColumns: "auto 1fr auto auto",
//                             gap: "8px",
//                             alignItems: "center",
//                             marginLeft: "8px"
//                           }}>
//                             <div style={{ textAlign: "left" }}>• Round {p.finishedAtRound}/36</div>
//                             <div style={{ textAlign: "center" }}>{Math.min(36 - (p.finishedAtRound as number), 8)}×</div>
//                             <div style={{ textAlign: "right" }}>{Math.min(36 - (p.finishedAtRound as number), 8)} pts</div>
//                           </div>
//                         </div>
//                       )}

//                       <div style={{
//                         display: "grid",
//                         gridTemplateColumns: "auto 1fr auto auto",
//                         gap: "8px",
//                         alignItems: "center"
//                       }}>
//                         <div style={{ textAlign: "left" }}><strong>Ranking bonus:</strong></div>
//                         <div style={{ textAlign: "center" }}>{p.bonusPoints || 0}×</div>
//                         <div style={{ textAlign: "right" }}><strong>{p.bonusPoints || 0} pts</strong></div>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )
//           })}
//         </div>

//         <div style={{ textAlign: "center", marginTop: 16 }}>
//           <button
//             className="font-display"
//             onClick={() => {
//               setShowResult(false)
//               history.pushState({}, "", "/")
//               dispatchEvent(new PopStateEvent("popstate"))
//             }}
//           >
//             Back to Lobby
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }
