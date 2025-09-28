export default function Controls({
  isHost,
  status,
  round,
  canGenerate,
  onStartOrGenerate,
  onReady,
  readyDisabled,
  waitingLabel
}: {
  isHost: boolean
  status: "waiting" | "playing" | "ended"
  round: number
  canGenerate: boolean
  onStartOrGenerate: () => void
  onReady: () => void
  readyDisabled: boolean
  waitingLabel: string
}) {
  if (status === "ended") return null

  const label = status === "waiting" ? "Start Game" : "Generate Tile"
  const disabled = status === "waiting" ? !isHost : !canGenerate

  return (
    <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
      <button onClick={onStartOrGenerate} disabled={disabled}>{label}</button>
      <button onClick={onReady} disabled={readyDisabled}>Ready for Next Round</button>
      <span style={{ color: "#666" }}>{waitingLabel}</span>
    </div>
  )
}
