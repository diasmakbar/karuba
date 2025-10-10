import React, { useEffect, useMemo, useState, useRef } from "react"
import type {
  Board as BoardGrid,
  Branch,
  ExplorerState,
  ExplorerColor,
  TilesMetaMap,
  TempleWin,
} from "../lib/types"
import { opp, colorIdx, dirToName, dirToArrowSrc } from "../utils/board"
import Modal, { ModalButtons } from "./Modal"
import BoardCell from "./BoardCell"
import { BOARD_CONFIG, ANIMATION_CONFIG, Z_INDEX } from "./board/constants"
import { getBoardContainerStyle, getCellStyle, getArrowStyle, getGhostStyle, getHighlightBottomCenterStyle } from "./board/styles"
import { useBoardLogic } from "./board/useBoardLogic"
import { TempleComponent } from "./board/TempleComponent"
import { ExplorerComponent } from "./board/ExplorerComponent"

const DEBUG = false
const dlog = (...args: any[]) => { if (DEBUG) console.log("[Board]", ...args) }

const ARROW_SIZE = 28
type Dir = Branch

export default function Board({
  myPlayerId,
  board,
  tilesMeta,
  rewards,
  canPlace,
  onPlace,
  previewTileId,
  previewAt,
  onPreview,
  myMoves,
  myExplorers,
  temples,
  templeWins = [],
  onMoveOne,
  onEnterTemple,
  animGhost,
}: {
  myPlayerId: string
  board: BoardGrid
  tilesMeta: TilesMetaMap | Record<string, { branches: Branch[]; image?: number }>
  rewards: Record<number, ("gold" | "crystal")[] | "gold" | "crystal" | null>
  canPlace: boolean
  onPlace: (r: number, c: number) => void
  previewTileId?: number | null
  previewAt?: { r: number; c: number } | null
  onPreview?: (r: number, c: number) => void
  myMoves: number
  myExplorers: Record<ExplorerColor, ExplorerState>
  temples: { side: Branch; index: number; color: ExplorerColor }[]
  templeWins?: TempleWin[]
  onMoveOne: (color: ExplorerColor, dir: Dir) => void
  onEnterTemple: (color: ExplorerColor, side: Branch, index: number) => void
  animGhost?: {
    color: ExplorerColor
    from8: { r: number; c: number }
    to8: { r: number; c: number }
    stage: number
  } | null
  isFinished?: boolean
}) {
  const [confirmPlace, setConfirmPlace] = useState<{ r: number; c: number } | null>(null)
  const [selectedColor, setSelectedColor] = useState<ExplorerColor | null>(null)
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null)

  const [lastClick, setLastClick] = useState<{ key: string; t: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

// Kalau moves habis, auto-clear highlight
useEffect(() => {
  if (myMoves <= 0) setSelectedColor(null)
}, [myMoves])

// Clear selectedColor if the selected explorer no longer exists
useEffect(() => {
  if (selectedColor && !myExplorers[selectedColor]) {
    setSelectedColor(null)
  }
}, [selectedColor, myExplorers])
  
  useEffect(() => {
    dlog("props", {
      canPlace, previewTileId, previewAt, animGhost: !!animGhost,
      tilesMetaKeys: Object.keys(tilesMeta || {}).slice(0, 5),
      rewardsKeys: Object.keys(rewards || {}).slice(0, 5),
    })
  }, [canPlace, previewTileId, previewAt, tilesMeta, rewards, animGhost])

  // wins milik SAYA untuk menentukan temple pake win_*.svg atau tetap temples_*.svg di board ini
  const winByMe = useMemo(() => {
    const m = new Map<string, TempleWin>()
    for (const w of templeWins) {
      if (w.playerId === myPlayerId) {
        m.set(`${w.side}:${w.index}`, w)
      }
    }
    return m
  }, [templeWins, myPlayerId])

  const findTemple = (side: Branch, index: number) =>
    temples.find((t) => t.side === side && t.index === index)

  const doPlace = () => {
    if (confirmPlace) {
      onPlace(confirmPlace.r, confirmPlace.c)
      setConfirmPlace(null)
    }
  }

  // occupancy helper
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
      return !occupiedByOther(index, 0) // blok overlap
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

  // === Arrows untuk langkah selanjutnya
  type Arrow = { r: number; c: number; dir: Dir }
  type TempleTarget = { side: Branch; index: number; dir: Dir }
  const selected = selectedColor ? myExplorers[selectedColor] : undefined
  const isAnimating = !!animGhost

  const arrows: Arrow[] = useMemo(() => {
    if (isAnimating) return []
    const out: Arrow[] = []
    if (!selectedColor || myMoves <= 0 || !selected) return out

    if (selected.onEdge) {
      if (!canEnterFromEdge(selected)) return out
      const { side, index } = selected.onEdge
      let r = -1, c = -1
      if (side === "W") { r = index; c = 0 }
      else if (side === "S") { r = 5; c = index }
      else if (side === "E") { r = index; c = 5 }
      else { r = 0; c = index }
      const tid = board[r][c]
      if (tid === -1) return out
      const meta = (tilesMeta as any)[String(tid)]
      if (!meta?.branches?.includes(side)) return out
      if (occupiedByOther(r, c)) return out
      out.push({ r, c, dir: opp(side) })
      return out
    }

    if (selected.onBoard) {
      const { r, c, entry } = selected.onBoard
      const tid = board[r][c]
      if (tid === -1) return out
      const meta = (tilesMeta as any)[String(tid)]
      if (!meta?.branches) return out
      const exits = meta.branches

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
          out.push({ r: nr, c: nc, dir })
        }
      }
    }

    return out
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isAnimating,
    selectedColor,
    selected?.onBoard?.r,
    selected?.onBoard?.c,
    selected?.onBoard?.entry,
    selected?.onEdge?.side,
    selected?.onEdge?.index,
    board,
    myMoves,
    myExplorers,
    tilesMeta,
  ])

  // Set panah → dir lookup biar cell click bisa buka confirm
  const arrowsMap = useMemo(() => {
    const m = new Map<string, Dir>()
    for (const a of arrows) m.set(`${a.r},${a.c}`, a.dir)
    return m
  }, [arrows])

  // Temple target (tidak diblok oleh kemenangan pemain lain; hanya kalau SAYA sudah win temple itu, dan warna match)
  const templeTargets: TempleTarget[] = useMemo(() => {
    if (isAnimating) return []
    const t: TempleTarget[] = []
    if (!selectedColor || !selected?.onBoard || myMoves <= 0) return t
    const { r, c, entry } = selected.onBoard
    const tid = board[r][c]
    if (tid === -1) return t
    const meta = (tilesMeta as any)[String(tid)]
    const exits = (meta?.branches || []).filter((b: Branch) => b !== entry)

    for (const dir of exits) {
      if (dir === "N" && r === 0) {
        const temple = findTemple("N", c)
        const winMine = winByMe.get(`N:${c}`) // kalau saya sudah win, jangan highlight
        if (!winMine && temple?.color === selectedColor) t.push({ side: "N", index: c, dir })
      }
      if (dir === "E" && c === 5) {
        const temple = findTemple("E", r)
        const winMine = winByMe.get(`E:${r}`)
        if (!winMine && temple?.color === selectedColor) t.push({ side: "E", index: r, dir })
      }
    }
    return t
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isAnimating,
    selectedColor,
    selected?.onBoard?.r,
    selected?.onBoard?.c,
    selected?.onBoard?.entry,
    board,
    myMoves,
    templeWins, // kalau saya baru win, targets berubah
  ])

  // Calculate cell center using percentage positioning (responsive)
  const getCellCenter = (row: number, col: number) => {
    // Each cell is 12.5% of the total width/height (1/8)
    // Center of cell at (row, col) is at (col * 12.5% + 6.25%, row * 12.5% + 6.25%)
    const cellSizePercent = 100 / 8 // 12.5%
    const centerOffset = cellSizePercent / 2 // 6.25%
    return {
      left: `${col * cellSizePercent + centerOffset}%`,
      top: `${row * cellSizePercent + centerOffset}%`
    }
  }

  const isFinished = !myExplorers || Object.keys(myExplorers).length === 0

  const handleCellClick = (r6: number, c6: number) => {
    if (isFinished) return
    // PRIORITAS: kalau lagi memilih explorer → klik cell tujuan buat gerak
    if (selectedColor && myMoves > 0) {
      const k = `${r6},${c6}`
      const dir = arrowsMap.get(k)
      if (dir) {
        const now = Date.now()
        const kKey = `${selectedColor}-${r6},${c6}`

        if (lastClick && lastClick.key === kKey && now - lastClick.t < 300) {
          // 🚀 Double click cepat → langsung gerak explorer ke arah dir
          onMoveOne(selectedColor, dir)
          setLastClick(null)
        } else {
          // 👆 Single click → set timer dulu buat bedain dari double click
          setLastClick({ key: kKey, t: now })
          setTimeout(() => {
            // kalau setelah 300ms gak ada klik kedua, baru munculin confirm modal
            if (
              !lastClick ||
              lastClick.key !== kKey ||
              Date.now() - lastClick.t >= 300
            ) {
              onMoveOne(selectedColor, dir)
            }
          }, 310)
        }
        return
      }
    }

    // kalau nggak sedang gerak, baru urusan place tile
    if (!canPlace) return
    const tileId = board[r6][c6]
    if (tileId !== -1) return
    const isPreviewHere =
      !!canPlace &&
      !!previewTileId &&
      !!previewAt &&
      previewAt.r === r6 &&
      previewAt.c === c6 &&
      tileId === -1
    if (isPreviewHere) {
      setConfirmPlace({ r: r6, c: c6 })
    } else {
      onPreview?.(r6, c6)
    }
  }

  return (
    <div
      style={getBoardContainerStyle()}
      onClick={() => setSelectedColor(null)}
    >
      <style dangerouslySetInnerHTML={{ __html: `${ANIMATION_CONFIG.CONFIRM_BLINK_KEYFRAMES}` }} />

      {Array.from({ length: 8 }).map((_, r) =>
        Array.from({ length: 8 }).map((_, c) => {
          // CORNERS (r=0,c=0; r=0,c=7; r=7,c=0; r=7,c=7) - empty
          if ((r === 0 || r === 7) && (c === 0 || c === 7))
            return <div key={`corner-${r}-${c}`} style={{ width: "100%", height: "100%" }} />

          // TOP temples (N) - r=0, c=1-6
          if (r === 0 && c >= 1 && c <= 6) {
            const t = findTemple("N", c - 1)
            const winMine = winByMe.get(`N:${c - 1}`)
            const color = winMine ? winMine.color : t?.color
            const idx = color ? colorIdx(color) : 0
            const showHighlight =
              selectedColor &&
              !winMine &&
              templeTargets.some((tt) => tt.side === "N" && tt.index === c - 1)

            return (
              <div key={`top-${c}`} style={{ width: "100%", height: "100%", position: "relative" }}>
                {t && showHighlight && (
                  <img src="/highlight.gif" alt="Temple highlight" style={getHighlightBottomCenterStyle()} />
                )}

                {t && winMine && (
                  <img
                    src={`/temples/win_${idx}_top.svg`}
                    alt={`Temple win ${color}`}
                    style={{ position: "absolute", inset: 4, width: "calc(100% - 8px)", height: "calc(100% - 8px)", objectFit: "contain", zIndex: 5 }}
                  />
                )}

                {t && !winMine && (
                  <img
                    src={`/temples/temples_${idx}_top.svg`}
                    alt={`Temple ${color}`}
                    onClick={(e) => {
                      if (!showHighlight || isFinished) return
                      e.stopPropagation()
                      if (!selectedColor || isAnimating) return
                      onEnterTemple(selectedColor, "N", c - 1)
                    }}
                    style={{ position: "absolute", inset: 4, width: "calc(100% - 8px)", height: "calc(100% - 8px)", objectFit: "contain", zIndex: 5, cursor: showHighlight ? "pointer" : "default" }}
                  />
                )}
              </div>
            )
          }

          // RIGHT temples (E)
          if (c === 7 && r >= 1 && r <= 6) {
            const t = findTemple("E", r - 1)
            const winMine = winByMe.get(`E:${r - 1}`)
            const color = winMine ? winMine.color : t?.color
            const idx = color ? colorIdx(color) : 0
            const showHighlight =
              selectedColor &&
              !winMine &&
              templeTargets.some((tt) => tt.side === "E" && tt.index === r - 1)

            return (
              <div key={`right-${r}`} style={{ width: "100%", height: "100%", position: "relative" }}>
                {t && showHighlight && (
                  <img src="/highlight.gif" alt="Temple highlight" style={getHighlightBottomCenterStyle()} />
                )}

                {t && winMine && (
                  <img
                    src={`/temples/win_${idx}_side.svg`}
                    alt={`Temple win ${color}`}
                    style={{ position: "absolute", inset: 4, width: "calc(100% - 8px)", height: "calc(100% - 8px)", objectFit: "contain", zIndex: 5 }}
                  />
                )}

                {t && !winMine && (
                  <img
                    src={`/temples/temples_${idx}_side.svg`}
                    alt={`Temple ${color}`}
                    onClick={(e) => {
                      if (!showHighlight || isFinished) return
                      e.stopPropagation()
                      if (!selectedColor || isAnimating) return
                      onEnterTemple(selectedColor, "E", r - 1)
                    }}
                    style={{ position: "absolute", inset: 4, width: "calc(100% - 8px)", height: "calc(100% - 8px)", objectFit: "contain", zIndex: 5, cursor: showHighlight ? "pointer" : "default" }}
                  />
                )}
              </div>
            )
          }

          // LEFT edge explorers (W)
          if (c === 0 && r >= 1 && r <= 6) {
            const ex = edgeExplorerAt("W", r - 1)
            if (!ex) return <div key={`left-${r}`} style={{ width: "100%", height: "100%" }} />
            const idx = colorIdx(ex.color)
            const highlighted = canEnterFromEdge(ex) && myMoves > 0
            const isSelected = selectedColor === ex.color
            return (
              <div key={`left-${r}`} style={{ width: "100%", height: "100%", position: "relative" }}>
                {highlighted && isSelected && (
                  <img src="/highlight.gif" alt="highlight" style={getHighlightBottomCenterStyle()} />
                )}
                {!isAnimating && (
                  <img
                    src={`/explorers/explorers_${idx}${ex.frame && ex.frame > 0 ? `_${ex.frame}` : ""}.svg`}
                    alt={`${ex.color} explorer`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!myMoves || !highlighted || isFinished) return
                      setSelectedColor(isSelected ? null : ex.color)
                    }}
                    style={{ position: "absolute", inset: 4, width: "calc(100% - 8px)", height: "calc(100% - 8px)", objectFit: "contain", transform: "scale(0.85)", transformOrigin: "center", zIndex: 5, cursor: highlighted ? "pointer" : "default" }}
                  />
                )}
              </div>
            )
          }

          // BOTTOM edge explorers (S)
          if (r === 7 && c >= 1 && c <= 6) {
            const ex = edgeExplorerAt("S", c - 1)
            if (!ex) return <div key={`bottom-${c}`} style={{ width: "100%", height: "100%" }} />
            const idx = colorIdx(ex.color)
            const highlighted = canEnterFromEdge(ex) && myMoves > 0
            const isSelected = selectedColor === ex.color
            return (
              <div key={`bottom-${c}`} style={{ width: "100%", height: "100%", position: "relative" }}>
                {highlighted && isSelected && (
                  <img src="/highlight.gif" alt="highlight" style={getHighlightBottomCenterStyle()} />
                )}
                {!isAnimating && (
                  <img
                    src={`/explorers/explorers_${idx}${ex.frame && ex.frame > 0 ? `_${ex.frame}` : ""}.svg`}
                    alt={`${ex.color} explorer`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!myMoves || !highlighted || isFinished) return
                      setSelectedColor(isSelected ? null : ex.color)
                    }}
                    style={{ position: "absolute", inset: 4, width: "calc(100% - 8px)", height: "calc(100% - 8px)", objectFit: "contain", transform: "scale(0.85)", transformOrigin: "center", zIndex: 5, cursor: highlighted ? "pointer" : "default" }}
                  />
                )}
              </div>
            )
          }

          // playable cells
          const r6 = r - 1, c6 = c - 1
          const tileId = board[r6][c6]
          const reward = tileId !== -1 ? rewards[tileId] || [] : []
          const isPreviewHere =
            !!canPlace &&
            !!previewTileId &&
            !!previewAt &&
            previewAt.r === r6 &&
            previewAt.c === c6 &&
            tileId === -1
          const imgId = tileId !== -1 ? (tilesMeta as any)[String(tileId)]?.image ?? tileId : null
          const previewImgId = previewTileId != null ? (tilesMeta as any)[String(previewTileId)]?.image ?? previewTileId : null

          return (
            <BoardCell
              key={`cell-${r}-${c}`}
              r6={r6}
              c6={c6}
              tileId={tileId}
              reward={reward}
              isPreviewHere={isPreviewHere}
              previewTileId={previewTileId}
              previewImgId={previewImgId}
              previewReward={previewTileId ? rewards[previewTileId] || null : null}
              imgId={imgId}
              onCellClick={() => handleCellClick(r6, c6)}
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              myMoves={myMoves}
              myExplorers={myExplorers}
              arrowsMap={arrowsMap}
              highlightBottomCenterStyle={getHighlightBottomCenterStyle()}
              canStep={myMoves > 0}
              isAnimating={isAnimating}
              colorIdx={colorIdx}
              isFinished={isFinished}
            />
          )
        })
      )}

      {/* ARROWS */}
      {selectedColor &&
        !isAnimating &&
        arrows.length > 0 &&
        arrows.map((a, i) => {
          // a.r, a.c are target board coordinates (0-5)
          // Convert to 8x8 grid coordinates (1-6)
          const targetRow = a.r + 1
          const targetCol = a.c + 1

          // Get origin position (where explorer currently is)
          let originRow = -1, originCol = -1
          if (selected.onEdge) {
            // Explorer is on edge, calculate entry position
            const { side, index } = selected.onEdge
            if (side === "W") { originRow = index + 1; originCol = 0 }
            else if (side === "S") { originRow = 7; originCol = index + 1 }
            else if (side === "E") { originRow = index + 1; originCol = 7 }
            else { originRow = 0; originCol = index + 1 }
          } else if (selected.onBoard) {
            // Explorer is on board
            originRow = selected.onBoard.r + 1
            originCol = selected.onBoard.c + 1
          }

          if (originRow === -1 || originCol === -1) return null

          // Position arrow midway between origin and target
          const originCenter = getCellCenter(originRow, originCol)
          const targetCenter = getCellCenter(targetRow, targetCol)

          // Parse percentages and calculate midpoint
          const originLeft = parseFloat(originCenter.left) / 100
          const originTop = parseFloat(originCenter.top) / 100
          const targetLeft = parseFloat(targetCenter.left) / 100
          const targetTop = parseFloat(targetCenter.top) / 100

          const midLeft = (originLeft + targetLeft) / 2
          const midTop = (originTop + targetTop) / 2

          return (
            <img
              key={`arr-${i}-${a.r}-${a.c}-${a.dir}`}
              src={dirToArrowSrc(a.dir)}
              alt={`arrow ${dirToName(a.dir)}`}
              onClick={(e) => {
                e.stopPropagation()
                if (isFinished) return
                onMoveOne(selectedColor, a.dir)
              }}
              style={{
                position: "absolute",
                left: `${midLeft * 100}%`,
                top: `${midTop * 100}%`,
                width: ARROW_SIZE,
                height: ARROW_SIZE,
                transform: "translate(-50%, -50%)",
                zIndex: 4,
                cursor: "pointer",
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
              }}
            />
          )
        })}

      {/* GHOST anim */}
      {animGhost &&
        (() => {
          const idx = colorIdx(animGhost.color)

          // Calculate smooth interpolation based on stage
          let t = 0
          if (animGhost.stage === 0) {
            t = 0 // At source tile
          } else if (animGhost.stage <= 12) {
            // Stages 1-12: Moving from source to target (12 stages for smooth movement)
            t = (animGhost.stage - 0) / 12
          } else {
            // Stages 13-14: At target tile
            t = 1
          }

          // animGhost.from8 and to8 are already 8x8 grid coordinates
          const currentRow = animGhost.from8.r + (animGhost.to8.r - animGhost.from8.r) * t
          const currentCol = animGhost.from8.c + (animGhost.to8.c - animGhost.from8.c) * t
          const center = getCellCenter(currentRow, currentCol)

          // Frame selection based on stage
          const src =
            animGhost.stage === 0
              ? `/explorers/explorers_${idx}_1.svg`  // Frame 1 (source)
              : animGhost.stage <= 12
              ? `/explorers/explorers_${idx}_2.svg`  // Frame 2 (moving)
              : `/explorers/explorers_${idx}.svg`     // Frame 1 (target)

          return (
            <img
              key="ghost"
              src={src}
              alt="moving explorer"
              style={{
                position: "absolute",
                left: center.left,
                top: center.top,
                width: "12.5%", // One cell width
                height: "12.5%", // One cell height
                transform: "translate(-50%, -50%) scale(0.85)",
                transformOrigin: "center",
                objectFit: "contain",
                zIndex: 10,
                pointerEvents: "none",
              }}
            />
          )
        })()}

      {confirmPlace && (
        <Modal>
          <p>Place tile here?</p>
          <ModalButtons
            onYes={doPlace}
            onCancel={() => setConfirmPlace(null)}
          />
        </Modal>
      )}
    </div>
  )
}
