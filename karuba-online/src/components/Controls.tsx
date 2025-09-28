export default function Controls({
  isHost,
  status,
  round,
  canGenerate,
  onStartOrGenerate,
  waitingLabel
}: {
  isHost: boolean
  status: "waiting" | "playing" | "ended"
  round: number
  canGenerate: boolean
  onStartOrGenerate: () => void
  waitingLabel: string
}) {
  if (status === "ended") return null

  const label =
    status === "waiting" ? "Start Game" : round >= 2 ? "Generate Tile" : "Generate Tile"

  const disabled =
    status === "waiting" ? !isHost : !canGenerate // round 0 host only; round>=2 only turn owner

  return (
    <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
      <button onClick={onStartOrGenerate} disabled={disabled}>
        {label}
      </button>
      {!disabled && status === "playing" && round >= 2 ? (
        <span style={{ color: "#666" }}>It's your turn to generate</span>
      ) : (
        <span style={{ color: "#666" }}>{waitingLabel}</span>
      )}
    </div>
  )
}
