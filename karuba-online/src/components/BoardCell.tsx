import React from "react"
import type { ExplorerColor } from "../lib/types"

interface BoardCellProps {
  r6: number
  c6: number
  tileId: number
  reward: ("gold" | "crystal")[] | "gold" | "crystal" | null
  isPreviewHere: boolean
  previewTileId: number | null
  previewImgId: number | null
  previewReward: ("gold" | "crystal")[] | "gold" | "crystal" | null
  imgId: number | null
  onCellClick: () => void
  selectedColor: ExplorerColor | null
  setSelectedColor: (color: ExplorerColor | null) => void
  myMoves: number
  myExplorers: Record<ExplorerColor, any>
  arrowsMap: Map<string, any>
  highlightBottomCenterStyle: React.CSSProperties
  canStep: boolean
  isAnimating: boolean
  colorIdx: (color: ExplorerColor) => number
  isFinished: boolean
  animGhost?: {
    color: ExplorerColor
    from8: { r: number; c: number }
    to8: { r: number; c: number }
    stage: number
  } | null
}

export default function BoardCell(props: BoardCellProps) {
  const {
    r6,
    c6,
    tileId,
    reward,
    isPreviewHere,
    previewTileId,
    previewImgId,
    imgId,
    onCellClick,
    selectedColor,
    setSelectedColor,
    myMoves,
    myExplorers,
    arrowsMap,
    highlightBottomCenterStyle,
    canStep,
    isAnimating,
    colorIdx,
    isFinished,
    animGhost,
  } = props

  // Handle both old format (single value) and new format (array)
  const rewardsArray: ("gold" | "crystal")[] = Array.isArray(reward)
    ? reward
    : reward ? [reward] : []

  // Handle preview rewards
  const previewRewardsArray: ("gold" | "crystal")[] = Array.isArray(props.previewReward)
    ? props.previewReward
    : props.previewReward ? [props.previewReward] : []

  const cursor = (selectedColor && myMoves > 0 && arrowsMap.has(`${r6},${c6}`))
    ? "pointer"
    : (tileId === -1 ? "pointer" : "default")

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        border: `3px solid var(--cell-border)`,
        background: "transparent",
        borderRadius: 6,
        overflow: "hidden",
        cursor,
      }}
      onClick={onCellClick}
      data-cell={`${r6},${c6}`}
    >
      {tileId !== -1 && imgId != null && (
        <img
          src={`/tiles/${imgId}.webp`}
          alt={`Tile ${tileId}`}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", zIndex: 1 }}
        />
      )}

      {rewardsArray.map((r, index) => (
        <img
          key={r + index}
          src={`/tiles/${r}.webp`}
          alt={r === "gold" ? "Gold" : "Crystal"}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            zIndex: 2,
            transform: rewardsArray.length > 1 ? `translate(${index * 2}px, ${index * 2}px)` : undefined,
          }}
        />
      ))}

      {isPreviewHere && (previewImgId != null) && (
        <>
          <img
            src={`/tiles/${previewImgId}.webp`}
            alt={`Preview tile ${previewTileId}`}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", zIndex: 1, opacity: 0.95 }}
          />
          {(() => {
            if (previewRewardsArray.length === 0) return null
            return previewRewardsArray.map((r, index) => (
              <img
                key={r + index}
                src={`/tiles/${r}.webp`}
                alt={r === "gold" ? "Gold" : "Crystal"}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  zIndex: 2,
                  opacity: 0.95,
                  transform: previewRewardsArray.length > 1 ? `translate(${index * 2}px, ${index * 2}px)` : undefined,
                }}
              />
            ))
          })()}

          <img
            src="/tiles/confirm.png"
            alt="confirm border"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", zIndex: 8, pointerEvents: "none", animation: "confirmBlink 1s ease-in-out infinite" }}
          />
        </>
      )}

      {Object.values(myExplorers || {}).map((ex) => {
        if (!ex.onBoard || ex.onBoard.r !== r6 || ex.onBoard.c !== c6) return null
        // Hide all explorers during animation to prevent double rendering
        if (isAnimating) return null
        const idx = colorIdx(ex.color)
        const isSelected = selectedColor === ex.color
        const frameSuffix = ex.frame && ex.frame > 0 ? `_${ex.frame}` : ""
        return (
          <React.Fragment key={`ex-${ex.color}-${r6}-${c6}`}>
            {canStep && isSelected && (
              <img src="/highlight.gif" alt="highlight" style={highlightBottomCenterStyle} />
            )}
            <img
              src={`/explorers/explorers_${idx}${frameSuffix}.svg`}
              alt={`${ex.color} explorer`}
              style={{
                position: "absolute", inset: 4,
                width: "calc(100% - 8px)", height: "calc(100% - 8px)",
                objectFit: "contain", transform: "scale(0.85)", transformOrigin: "center", zIndex: 5,
                display: "block", cursor: canStep ? "pointer" : "default",
              }}
              onClick={(e) => {
                e.stopPropagation()
                if (!canStep || isAnimating || isFinished) return
                setSelectedColor(isSelected ? null : ex.color)
              }}
            />
          </React.Fragment>
        )
      })}
    </div>
  )
}
