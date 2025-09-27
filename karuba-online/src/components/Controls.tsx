export default function Controls({
  isHost,
  status,
  onStart
}: {
  isHost: boolean
  status: "waiting" | "playing" | "ended"
  onStart: () => void
}) {
  return (
    <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
      {status === "waiting" && isHost ? (
        <button onClick={onStart}>Start Game</button>
      ) : null}
      {status === "waiting" && !isHost ? (
        <span>Waiting host to start the game…</span>
      ) : null}
    </div>
  )
}


// export default function Controls({
//   isHost,
//   status,
//   isMyTurn,
//   currentTile,
//   onStart,
//   onShuffle,
//   onEndRound
// }: {
//   isHost: boolean
//   status: "lobby" | "active" | "ended"
//   isMyTurn: boolean
//   currentTile: number | null
//   onStart: () => void
//   onShuffle: () => void
//   onEndRound: () => void
// }) {
//   return (
//     <div style={{ marginTop: 12 }}>
//       {status === "lobby" && isHost ? (
//         <button onClick={onStart}>Start Game</button>
//       ) : (
//         <button
//           onClick={onShuffle}
//           disabled={!isMyTurn || currentTile !== null}
//         >
//           Shuffle Tiles
//         </button>
//       )}
//       <button
//         onClick={onEndRound}
//         disabled={currentTile === null}
//         style={{ marginLeft: 8 }}
//       >
//         End Round
//       </button>
//     </div>
//   )
// }
