import type { Player } from "../lib/types"

export default function Scoreboard({
  players,
  shuffleTurnUid
}: {
  players: Record<string, Player>
  shuffleTurnUid: string
}) {
  const sorted = Object.values(players).sort(
    (a, b) => a.joinedAt - b.joinedAt
  )

  return (
    <div>
      <h3>Scoreboard</h3>
      <ul>
        {sorted.map(p => (
          <li
            key={p.name}
            style={{
              fontWeight: p.id === shuffleTurnUid ? "bold" : "normal",
              color: p.id === shuffleTurnUid ? "#1d4ed8" : "#000",
              listStyle: "none",
              margin: "4px 0"
            }}
          >
            {p.name}: {p.score}
            {p.id === shuffleTurnUid && " 🔄"} {/* ikon giliran */}
          </li>
        ))}
      </ul>
    </div>
  )
}
