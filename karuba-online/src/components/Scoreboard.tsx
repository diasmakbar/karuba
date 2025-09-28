import type { Player } from "../lib/types"

export default function Scoreboard({
  players,
  generateTurnUid
}: {
  players: Record<string, Player>
  generateTurnUid: string
}) {
  const list = Object.values(players).sort((a, b) => a.joinedAt - b.joinedAt)

  return (
    <div>
      <h3>Players</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {list.map((p) => {
          const isTurn = p.id === generateTurnUid
          return (
            <li
              key={p.id}
              style={{
                marginBottom: 6,
                fontWeight: p.doneForRound ? "normal" : "bold",
                color: isTurn ? "#1e40af" : p.doneForRound ? "green" : "black"
              }}
            >
              {p.name} — Score: {p.score} — Moves: {p.moves}{" "}
              {p.doneForRound ? <span>✔</span> : <span>(playing)</span>}
              {isTurn ? <span style={{ marginLeft: 6, fontSize: 12, color: "#1e40af" }}>⏺ generate turn</span> : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
