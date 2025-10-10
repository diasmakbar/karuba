export default function Controls({
  isHost,
  status,
  round,
  canGenerate,
  onStartOrGenerate,
  onReady,
  onShowScoreboard,
  readyDisabled,
  waitingLabel,
  playerMoves,
  unfinishedExplorers
}: {
  isHost: boolean
  status: "waiting" | "playing" | "ended"
  round: number
  canGenerate: boolean
  onStartOrGenerate: () => void
  onReady: () => void
  onShowScoreboard: () => void
  readyDisabled: boolean
  waitingLabel: string
  playerMoves?: number
  unfinishedExplorers?: number
}) {
  if (status === "ended") {
    return (
      <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={onShowScoreboard}>Show Scoreboard</button>
      </div>
    )
  }

  const label = status === "waiting" ? "Start Game" : "Generate Tile"
  const disabled = status === "waiting" ? !isHost : !canGenerate
  const readyButtonText = round === 36 ? "Finish Game" : "Ready for Next Round"

  const handleReadyClick = () => {
    if (round === 36 && (playerMoves || unfinishedExplorers)) {
      // Show confirmation modal for finishing game early
      if (!confirm(`Are you sure to finish the game? You still have ${playerMoves || 0} moves and ${unfinishedExplorers || 0} unfinished explorers.`)) {
        return
      }
    }
    onReady()
  }

  return (
    <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
      <button onClick={onStartOrGenerate} disabled={disabled}>{label}</button>
      <button onClick={handleReadyClick} disabled={readyDisabled}>{readyButtonText}</button>
      <span style={{ color: "#666" }}>{waitingLabel}</span>
    </div>
  )
}
