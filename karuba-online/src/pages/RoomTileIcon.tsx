import React from "react"

export default function TileIcon({
  id,
  tilesMeta,
  size = 40,
  reward,
}: {
  id: number
  tilesMeta: Record<string, { image?: number }>
  size?: number
  reward?: "gold" | "crystal" | null
}) {
  const img = (tilesMeta as any)?.[String(id)]?.image ?? id
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <img
        src={`/tiles/${img}.webp`}
        alt={`Tile ${id}`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
      />
      {reward === "gold" && (
        <img
          src="/tiles/gold.webp"
          alt="Gold"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
        />
      )}
      {reward === "crystal" && (
        <img
          src="/tiles/crystal.webp"
          alt="Crystal"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
        />
      )}
    </div>
  )
}
