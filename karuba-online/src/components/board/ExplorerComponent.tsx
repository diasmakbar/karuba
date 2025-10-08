import React from 'react'
import type { ExplorerState, ExplorerColor } from '../../lib/types'
import { colorIdx } from '../../utils/board'
import { getHighlightBottomCenterStyle, getExplorerStyle } from './styles'

interface ExplorerComponentProps {
  explorer: ExplorerState
  highlighted: boolean
  isSelected: boolean
  isAnimating: boolean
  onExplorerClick?: (color: ExplorerColor) => void
}

export const ExplorerComponent: React.FC<ExplorerComponentProps> = ({
  explorer,
  highlighted,
  isSelected,
  isAnimating,
  onExplorerClick,
}) => {
  const idx = colorIdx(explorer.color)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!highlighted) return
    onExplorerClick?.(explorer.color)
  }

  return (
    <div style={{ width: 56, height: 56, position: "relative" }}>
      {highlighted && isSelected && (
        <img src="/highlight.gif" alt="highlight" style={getHighlightBottomCenterStyle()} />
      )}
      {!isAnimating && (
        <img
          src={`/explorers/explorers_${idx}${explorer.frame && explorer.frame > 0 ? `_${explorer.frame}` : ""}.svg`}
          alt={`${explorer.color} explorer`}
          onClick={handleClick}
          style={getExplorerStyle()}
        />
      )}
    </div>
  )
}
