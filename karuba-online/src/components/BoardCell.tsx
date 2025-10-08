import React from "react"
import type { ExplorerColor } from "../lib/types"

const CELL = 56

interface BoardCellProps {
  r6: number
  c6: number
  tileId: number
  reward: "gold" | "crystal" | null
  isPreviewHere: boolean
  previewTileId: number | null
  previewImgId: number | null
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
    myMoves,
    myExplorers,
    arrowsMap,
    highlightBottomCenterStyle,
    canStep,
    isAnimating,
    colorIdx,
    isFinished,
  } = props

  const cursor = (selectedColor && myMoves > 0 && arrowsMap.has(`${r6},${c6}`))
    ? "pointer"
    : (tileId === -1 ? "pointer" : "default")

  return (
    <div
      style={{
        width: CELL,
        height: CELL,
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

      {reward === "gold" && (
        <img
          src="/tiles/gold.webp"
          alt="Gold"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", zIndex: 2 }}
        />
      )}
      {reward === "crystal" && (
        <img
          src="/tiles/crystal.webp"
          alt="Crystal"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", zIndex: 2 }}
        />
      )}

      {isPreviewHere && (previewImgId != null) && (
        <>
          <img
            src={`/tiles/${previewImgId}.webp`}
            alt={`Preview tile ${previewTileId}`}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", zIndex: 1, opacity: 0.95 }}
          />
          {(() => {
            const rw = reward
            if (!rw) return null
            return (
              <img
                src={`/tiles/${rw}.webp`}
                alt={`${rw}`}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", zIndex: 2, opacity: 0.95 }}
              />
            )
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
        if (isAnimating && ex.color === selectedColor) return null
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
                console.log("Clicked explorer:", ex.color, "at position", r6, c6)
              }}
            />
          </React.Fragment>
        )
      })}
    </div>
  )
}
