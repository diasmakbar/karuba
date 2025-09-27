export default function Controls({
  isHost,
  status,
  isMyTurn,
  currentTile,
  onStart,
  onShuffle,
  onEndRound
}: {
  isHost: boolean
  status: "lobby" | "playing"
  isMyTurn: boolean
  currentTile: number | null
  onStart: () => void
  onShuffle: () => void
  onEndRound: () => void
}) {
  return (
    <div style={{ marginTop: 12 }}>
      {status === "lobby" && isHost ? (
        <button onClick={onStart}>Start Game</button>
      ) : (
        <button
          onClick={onShuffle}
          disabled={!isMyTurn || currentTile !== null}
        >
          Shuffle Tiles
        </button>
      )}
      <button
        onClick={onEndRound}
        disabled={currentTile === null}
        style={{ marginLeft: 8 }}
      >
        End Round
      </button>
    </div>
  )
}
