import React from 'react'
import type { Branch, ExplorerColor } from '../../lib/types'
import { colorIdx } from '../../utils/board'
import { getHighlightBottomCenterStyle, getTempleStyle } from './styles'

interface TempleComponentProps {
  side: Branch
  index: number
  temple: { side: Branch; index: number; color: ExplorerColor } | undefined
  winMine: any
  showHighlight: boolean
  isFinished: boolean
  onTempleClick?: (side: Branch, index: number) => void
}

export const TempleComponent: React.FC<TempleComponentProps> = ({
  side,
  index,
  temple,
  winMine,
  showHighlight,
  isFinished,
  onTempleClick,
}) => {
  const color = winMine ? winMine.color : temple?.color
  const idx = color ? colorIdx(color) : 0

  const handleClick = (e: React.MouseEvent) => {
    if (!showHighlight || isFinished || !temple) return
    e.stopPropagation()
    onTempleClick?.(side, index)
  }

  return (
    <div style={{ width: 56, height: 56, position: "relative" }}>
      {temple && showHighlight && (
        <img src="/highlight.gif" alt="Temple highlight" style={getHighlightBottomCenterStyle()} />
      )}

      {temple && winMine && (
        <img
          src={`/temples/win_${idx}_${side === "N" ? "top" : "side"}.svg`}
          alt={`Temple win ${color}`}
          style={getTempleStyle(false)}
        />
      )}

      {temple && !winMine && (
        <img
          src={`/temples/temples_${idx}_${side === "N" ? "top" : "side"}.svg`}
          alt={`Temple ${color}`}
          onClick={handleClick}
          style={getTempleStyle(showHighlight)}
        />
      )}
    </div>
  )
}
