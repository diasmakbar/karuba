import type { Board } from "../lib/types"

export default function Board({
  board,
  rewards,
  onPlace
}: {
  board: Board
  rewards: Record<number, "gold" | "crystal" | null>
  onPlace: (r: number, c: number) => void
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 48px)",
        gap: 6
      }}
    >
      {board.map((row, r) =>
        row.map((cell, c) => {
          const reward = cell !== -1 ? rewards[cell] : null
          return (
            <div
              key={`${r}-${c}`}
              onClick={() => onPlace(r, c)}
              style={{
                width: 48,
                height: 48,
                border: "1px solid #ccc",
                position: "relative",
                cursor: "pointer",
                background: "#fff"
              }}
            >
              {cell !== -1 && (
                <>
                  <img
                    src={`/tiles/${cell}.png`}
                    alt={`Tile ${cell}`}
                    style={{ width: "100%", height: "100%" }}
                  />
                  {reward === "gold" && (
                    <img
                      src="/tiles/gold.png"
                      alt="Gold"
                      style={{
                        position: "absolute",
                        bottom: 2,
                        right: 2,
                        width: 16,
                        height: 16
                      }}
                    />
                  )}
                  {reward === "crystal" && (
                    <img
                      src="/tiles/crystal.png"
                      alt="Crystal"
                      style={{
                        position: "absolute",
                        bottom: 2,
                        right: 2,
                        width: 16,
                        height: 16
                      }}
                    />
                  )}
                </>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
