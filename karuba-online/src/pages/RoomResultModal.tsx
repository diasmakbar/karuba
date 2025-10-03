import React, { useState } from "react"
import type { Game, Player } from "../lib/types"

type Props = {
  open: boolean
  onClose: () => void
  game: Game | null
  players: Record<string, Player>
  currentPlayerId: string
}

/**
 * Rumus temple points (sesuai request):
 * pts = pj + 2 - order  (=> rank1 = pj+1, rank2 = pj, rank3 = pj-1, dst; minimal 0)
 */
function templePointsForOrder(order: number, playersCount: number): number {
  return Math.max(playersCount + 2 - order, 0)
}

export default function RoomResultModal({
  open,
  onClose,
  game,
  players,
  currentPlayerId,
}: Props) {
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null)
  if (!open || !game) return null

  const sorted = Object.values(players || {}).sort(
    (a, b) => b.score - a.score || a.joinedAt - b.joinedAt
  )
  const myPos = Math.max(1, sorted.findIndex((p) => p.id === currentPlayerId) + 1)
  const title =
    myPos === 1 ? "Victory! 🏆" : myPos === sorted.length ? "Game Over! ☠️" : "Game Result 🎲"

  const pj = Object.keys(players || {}).length
  const wins = (game.templeWins || []) as any[]

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
          width: 460,
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
        }}
      >
        <h2 className="font-display" style={{ marginTop: 0, marginBottom: 12, textAlign: "center" }}>
          {title}
        </h2>

        <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map((p, i) => {
            const rank = i + 1
            const isExpanded = expandedPlayer === p.id

            // Rekap temple milik player ini
            const mineWins = (wins || []).filter((w: any) => w.playerId === p.id)
            const countsByOrder: Record<number, number> = {}
            mineWins.forEach((w: any) => {
              const order = Number(w?.order || 0)
              if (!order) return
              countsByOrder[order] = (countsByOrder[order] || 0) + 1
            })

            // Hitung poin per order & total poin temple
            let templePoints = 0
            const pointsByOrder: Record<number, number> = {}
            Object.keys(countsByOrder)
              .map(Number)
              .sort((a, b) => a - b)
              .forEach((orderNum) => {
                const cnt = countsByOrder[orderNum]
                const ptsPerTemple = templePointsForOrder(orderNum, pj)
                const pts = cnt * ptsPerTemple
                pointsByOrder[orderNum] = pts
                templePoints += pts
              })

            // Rewards & bonus
            const goldCount = (p as any)?.goldCount || 0
            const crystalCount = (p as any)?.crystalCount || 0
            const rewardsPoints = goldCount + crystalCount

            const finishedAt = (p as any)?.finishedAtRound ?? null
            const roundBonus =
              finishedAt && finishedAt < 36 ? Math.min(36 - finishedAt, 8) : 0

            const placementBonus = (p as any)?.bonusPoints || 0

            const totalComputed =
              templePoints + rewardsPoints + roundBonus + placementBonus

            return (
              <div
                key={p.id}
                style={{
                  border: "1px solid rgba(0,0,0,0.1)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  background: isExpanded ? "rgba(0,0,0,0.05)" : "#fafafa",
                }}
              >
                <div
                  style={{
                    cursor: "pointer",
                    fontWeight: p.id === currentPlayerId ? 700 : 400,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                  onClick={() => setExpandedPlayer(isExpanded ? null : p.id)}
                >
                  <span>
                    {`(#${rank}) | ${p.name} | ${p.score} pts`}
                    {rank === 1 ? " 👑" : ""}
                  </span>
                  <span>{isExpanded ? "⤵" : "↩"}</span>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: 8, fontSize: 14 }}>
                    {/* Finishing Order */}
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Finishing Order:</div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: "2px 12px",
                        paddingLeft: 12,
                      }}
                    >
                      {Object.keys(countsByOrder).length > 0 ? (
                        Object.keys(countsByOrder)
                          .map(Number)
                          .sort((a, b) => a - b)
                          .map((orderNum) => {
                            const label =
                              orderNum === 1
                                ? "1st"
                                : orderNum === 2
                                ? "2nd"
                                : orderNum === 3
                                ? "3rd"
                                : `${orderNum}th`
                            return (
                              <React.Fragment key={orderNum}>
                                <div>
                                  • {label}: {countsByOrder[orderNum]}
                                </div>
                                <div>{pointsByOrder[orderNum] || 0} pts</div>
                              </React.Fragment>
                            )
                          })
                      ) : (
                        <>
                          <div>• Unfinished: 1</div>
                          <div>0 pts</div>
                        </>
                      )}
                    </div>

                    {/* Rewards */}
                    <div style={{ fontWeight: 600, margin: "8px 0 4px" }}>Rewards:</div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: "2px 12px",
                        paddingLeft: 12,
                      }}
                    >
                      <div>• Gold: {goldCount}</div>
                      <div>{goldCount} pts</div>
                      <div>• Crystal: {crystalCount}</div>
                      <div>{crystalCount} pts</div>
                      {finishedAt && finishedAt < 36 && (
                        <>
                          <div>• Round {finishedAt} /36</div>
                          <div>{roundBonus} pts</div>
                        </>
                      )}
                    </div>

                    {/* Placement bonus */}
                    <div style={{ fontWeight: 600, margin: "8px 0 4px" }}>
                      Ranking bonus:
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: "2px 12px",
                        paddingLeft: 12,
                      }}
                    >
                      <div>{placementBonus > 0 ? "• Placement bonus" : "• None"}</div>
                      <div>{placementBonus} pts</div>
                    </div>

                    {/* Total recompute (sanity check) */}
                    <div
                      style={{
                        fontWeight: 700,
                        marginTop: 8,
                        borderTop: "1px solid #ccc",
                        paddingTop: 4,
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                        }}
                      >
                        <div>Total:</div>
                        <div>{totalComputed} pts</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: 12 }}>
          <button className="font-display" onClick={onClose}>
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  )
}