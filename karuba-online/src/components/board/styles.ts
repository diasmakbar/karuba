import type { CSSProperties } from 'react'
import { BOARD_CONFIG, Z_INDEX } from './constants'

export const getHighlightBottomCenterStyle = (): CSSProperties => {
  const { CELL_SIZE, GAP_SIZE, HIGHLIGHT_DIAMETER, HIGHLIGHT_CENTER_FROM_BOTTOM, HIGHLIGHT_EXTRA_SHIFT_Y, HIGHLIGHT_OPACITY } = BOARD_CONFIG

  const ringTop = CELL_SIZE - HIGHLIGHT_CENTER_FROM_BOTTOM - HIGHLIGHT_DIAMETER / 2 + HIGHLIGHT_EXTRA_SHIFT_Y

  return {
    position: "absolute",
    left: "50%",
    top: ringTop,
    width: HIGHLIGHT_DIAMETER,
    height: HIGHLIGHT_DIAMETER,
    transform: "translateX(-50%)",
    objectFit: "contain",
    zIndex: Z_INDEX.HIGHLIGHT,
    opacity: HIGHLIGHT_OPACITY,
  }
}

export const getBoardContainerStyle = (): CSSProperties => ({
  position: "relative",
  display: "grid",
  gridTemplateColumns: `repeat(8, 1fr)`,
  gridTemplateRows: `repeat(8, 1fr)`,
  gap: BOARD_CONFIG.GAP_SIZE,
  padding: BOARD_CONFIG.GAP_SIZE,
  background: "transparent",
  borderRadius: 10,
  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
  width: "100%",
  height: "100%",
})

export const getCellStyle = (): CSSProperties => ({
  width: BOARD_CONFIG.CELL_SIZE,
  height: BOARD_CONFIG.CELL_SIZE,
})

export const getTempleStyle = (isHighlighted: boolean): CSSProperties => ({
  position: "absolute",
  inset: 4,
  width: "calc(100% - 8px)",
  height: "calc(100% - 8px)",
  objectFit: "contain",
  zIndex: Z_INDEX.EXPLORER,
  cursor: isHighlighted ? "pointer" : "default",
})

export const getExplorerStyle = (): CSSProperties => ({
  position: "absolute",
  inset: 4,
  width: "calc(100% - 8px)",
  height: "calc(100% - 8px)",
  objectFit: "contain",
  transform: "scale(0.85)",
  transformOrigin: "center",
  zIndex: Z_INDEX.EXPLORER,
  cursor: "pointer",
})

export const getArrowStyle = (): CSSProperties => ({
  position: "absolute",
  width: BOARD_CONFIG.ARROW_SIZE,
  height: BOARD_CONFIG.ARROW_SIZE,
  zIndex: Z_INDEX.ARROW,
  cursor: "pointer",
  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
})

export const getGhostStyle = (): CSSProperties => ({
  position: "absolute",
  width: BOARD_CONFIG.CELL_SIZE - 8,
  height: BOARD_CONFIG.CELL_SIZE - 8,
  objectFit: "contain",
  transform: "scale(0.85)",
  transformOrigin: "center",
  zIndex: Z_INDEX.GHOST,
  pointerEvents: "none",
})
