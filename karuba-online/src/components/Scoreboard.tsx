import type { Player } from "../lib/types"

export default function Scoreboard({
  players,
  shuffleTurnUid
}: {
  players: Record<string, Player>
  shuffleTurnUid: string
}) {
  const list = Object.values(players).sort(
    (a, b) => a.joinedAt - b.joinedAt
  )

  return (
    <div>
      <h3>Players</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {list.map((p) => {
          const isHost = p.id === shuffleTurnUid
          return (
            <li
              key={p.id}
              style={{
                marginBottom: 4,
                fontWeight: isHost ? "bold" : "normal",
                color: isHost ? "blue" : "black",
              }}
            >
              {p.name} — Score: {p.score}{" "}
              {p.doneForRound ? <span style={{ color: "green" }}>✔ done</span> : ""}
              {isHost ? " (Host)" : ""}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
