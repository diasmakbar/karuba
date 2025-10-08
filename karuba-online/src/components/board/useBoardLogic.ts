import { useMemo, useState, useEffect } from 'react'
import type { Board as BoardGrid, ExplorerState, ExplorerColor, Branch, TilesMetaMap, TempleWin } from '../../lib/types'
import { opp, colorIdx } from '../../utils/board'

export const useBoardLogic = ({
  myPlayerId,
  board,
  tilesMeta,
  myMoves,
  myExplorers,
  temples,
  templeWins,
  isAnimating,
}: {
  myPlayerId: string
  board: BoardGrid
  tilesMeta: TilesMetaMap
  myMoves: number
  myExplorers: Record<ExplorerColor, ExplorerState>
  temples: { side: Branch; index: number; color: ExplorerColor }[]
  templeWins: TempleWin[]
  isAnimating: boolean
}) => {
  const [selectedColor, setSelectedColor] = useState<ExplorerColor | null>(null)
  const [confirmPlace, setConfirmPlace] = useState<{ r: number; c: number } | null>(null)
  const [lastClick, setLastClick] = useState<{ key: string; t: number } | null>(null)

  // Auto-clear highlight when moves are exhausted
  useEffect(() => {
    if (myMoves <= 0) setSelectedColor(null)
  }, [myMoves])

  // Memoized temple wins by current player
  const winByMe = useMemo(() => {
    const m = new Map<string, TempleWin>()
    for (const w of templeWins) {
      if (w.playerId === myPlayerId) {
        m.set(`${w.side}:${w.index}`, w)
      }
    }
    return m
  }, [templeWins, myPlayerId])

  // Helper functions
  const findTemple = (side: Branch, index: number) =>
    temples.find((t) => t.side === side && t.index === index)

  const occupiedByOther = (r: number, c: number, except?: ExplorerColor) =>
    Object.values(myExplorers || {}).some(
      (ex) => ex.onBoard && ex.onBoard.r === r && ex.onBoard.c === c && ex.color !== except
    )

  const canEnterFromEdge = (e: ExplorerState): boolean => {
    if (!e.onEdge) return false
    const { side, index } = e.onEdge
    if (side === "W") {
      const t = board[index][0]
      if (t === -1) return false
      if (!(tilesMeta as any)[String(t)]?.branches?.includes("W")) return false
      return !occupiedByOther(index, 0)
    }
    if (side === "S") {
      const t = board[5][index]
      if (t === -1) return false
      if (!(tilesMeta as any)[String(t)]?.branches?.includes("S")) return false
      return !occupiedByOther(5, index)
    }
    if (side === "E") {
      const t = board[index][5]
      if (t === -1) return false
      if (!(tilesMeta as any)[String(t)]?.branches?.includes("E")) return false
      return !occupiedByOther(index, 5)
    }
    const t = board[0][index]
    if (t === -1) return false
    if (!(tilesMeta as any)[String(t)]?.branches?.includes("N")) return false
    return !occupiedByOther(0, index)
  }

  const edgeExplorerAt = (side: Branch, idx: number): ExplorerState | null => {
    const ex = Object.values(myExplorers || {}).find(
      (e) => e.onEdge && e.onEdge.side === side && e.onEdge.index === idx
    )
    return ex || null
  }

  // Memoized arrows calculation
  const arrows = useMemo(() => {
    if (isAnimating) return []
    const selected = selectedColor ? myExplorers[selectedColor] : undefined
    if (!selectedColor || myMoves <= 0 || !selected) return []

    if (selected.onEdge) {
      if (!canEnterFromEdge(selected)) return []
      const { side, index } = selected.onEdge
      let r = -1, c = -1
      if (side === "W") { r = index; c = 0 }
      else if (side === "S") { r = 5; c = index }
      else if (side === "E") { r = index; c = 5 }
      else { r = 0; c = index }
      const tid = board[r][c]
      if (tid === -1) return []
      const meta = (tilesMeta as any)[String(tid)]
      if (!meta?.branches?.includes(side)) return []
      if (occupiedByOther(r, c)) return []
      return [{ r, c, dir: opp(side) }]
    }

    if (!selected.onBoard) return []
    const { r, c, entry } = selected.onBoard
    const tid = board[r][c]
    if (tid === -1) return []
    const meta = (tilesMeta as any)[String(tid)]
    const exits = (meta?.branches || []).filter((b: Branch) => b !== entry)

    const result = []
    for (const dir of exits) {
      let nr = r, nc = c
      if (dir === "N") nr = r - 1
      if (dir === "S") nr = r + 1
      if (dir === "E") nc = c + 1
      if (dir === "W") nc = c - 1
      if (nr >= 0 && nr < 6 && nc >= 0 && nc < 6) {
        const ntid = board[nr][nc]
        if (ntid === -1) continue
        const nmeta = (tilesMeta as any)[String(ntid)]
        if (!nmeta?.branches?.includes(opp(dir))) continue
        if (occupiedByOther(nr, nc, selectedColor || undefined)) continue
        result.push({ r: nr, c: nc, dir })
      }
    }
    return result
  }, [
    isAnimating,
    selectedColor,
    myMoves,
    myExplorers,
    board,
    tilesMeta,
    canEnterFromEdge,
    occupiedByOther,
  ])

  // Memoized temple targets calculation
  const templeTargets = useMemo(() => {
    if (isAnimating) return []
    const selected = selectedColor ? myExplorers[selectedColor] : undefined
    if (!selectedColor || !selected?.onBoard || myMoves <= 0) return []

    const { r, c, entry } = selected.onBoard
    const tid = board[r][c]
    if (tid === -1) return []
    const meta = (tilesMeta as any)[String(tid)]
    const exits = (meta?.branches || []).filter((b: Branch) => b !== entry)

    const result = []
    for (const dir of exits) {
      if (dir === "N" && r === 0) {
        const temple = findTemple("N", c)
        const winMine = winByMe.get(`N:${c}`)
        if (!winMine && temple?.color === selectedColor) {
          result.push({ side: "N" as Branch, index: c, dir })
        }
      }
      if (dir === "E" && c === 5) {
        const temple = findTemple("E", r)
        const winMine = winByMe.get(`E:${r}`)
        if (!winMine && temple?.color === selectedColor) {
          result.push({ side: "E" as Branch, index: r, dir })
        }
      }
    }
    return result
  }, [
    isAnimating,
    selectedColor,
    myMoves,
    myExplorers,
    board,
    tilesMeta,
    findTemple,
    winByMe,
  ])

  return {
    selectedColor,
    setSelectedColor,
    confirmPlace,
    setConfirmPlace,
    lastClick,
    setLastClick,
    winByMe,
    arrows,
    templeTargets,
    findTemple,
    occupiedByOther,
    canEnterFromEdge,
    edgeExplorerAt,
  }
}
