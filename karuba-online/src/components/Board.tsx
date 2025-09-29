import React, { useEffect, useMemo, useState } from "react"
import type {
  Board as BoardGrid,
  Branch,
  ExplorerState,
  ExplorerColor,
  TilesMetaMap,
  TempleWin,
} from "../lib/types"

const DEBUG = false
const dlog = (...args: any[]) => { if (DEBUG) console.log("[Board]", ...args) }

const CELL = 56
const GAP = 6

// grid (0) < tile(1) < reward(2) < highlight(3) < arrow(4) < explorer(5) < ghost(10)
const HIGHLIGHT_DIAMETER = 38
const HIGHLIGHT_CENTER_FROM_BOTTOM = 8
const HIGHLIGHT_EXTRA_SHIFT_Y = 0
const HIGHLIGHT_OPACITY = 0.75
const ringTop =
  CELL -
  HIGHLIGHT_CENTER_FROM_BOTTOM -
  HIGHLIGHT_DIAMETER / 2 +
  HIGHLIGHT_EXTRA_SHIFT_Y
const highlightBottomCenterStyle: React.CSSProperties = {
  position: "absolute",
  left: "50%",
  top: ringTop,
  width: HIGHLIGHT_DIAMETER,
  height: HIGHLIGHT_DIAMETER,
  transform: "translateX(-50%)",
  objectFit: "contain",
  zIndex: 3,
  opacity: HIGHLIGHT_OPACITY,
}

const ARROW_SIZE = 28
const colorIdx = (color: ExplorerColor) =>
  ({ red: 1, blue: 2, brown: 3, yellow: 4 } as const)[color]
const opp = (b: Branch): Branch =>
  b === "N" ? "S" : b === "S" ? "N" : b === "E" ? "W" : "E"
type Dir = Branch
const dirToName = (d: Dir) =>
  d === "N" ? "top" : d === "E" ? "right" : d === "S" ? "down" : "left"
const dirToArrowSrc = (d: Dir) => `/arrows/arrow_${dirToName(d)}.svg`

const BLINK_KEYFRAMES = `
@keyframes confirmBlink {
  0%   { opacity: .15; }
  45%  { opacity: 1;   }
  55%  { opacity: 1;   }
  100% { opacity: .15; }
}`

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
  rewards: Record<number, "gold" | "crystal" | null>
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
    stage: 1 | 2 | 3
  } | null
}) {
  const [confirmPlace, setConfirmPlace] = useState<{ r: number; c: number } | null>(null)
  const [confirmMove, setConfirmMove] = useState<{ color: ExplorerColor; dir: Dir } | null>(null)
  const [confirmTemple, setConfirmTemple] = useState<{
    color: ExplorerColor
    side: Branch
    index: number
  } | null>(null)
  const [selectedColor, setSelectedColor] = useState<ExplorerColor | null>(null)

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
    Object.values(myExplorers).some(
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
    const ex = Object.values(myExplorers).find(
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
      if (occupiedByOther(r, c)) return out // blok overlap
      out.push({ r, c, dir: opp(side) })
      return out
    }

    if (!selected.onBoard) return out
    const { r, c, entry } = selected.onBoard
    const tid = board[r][c]
    if (tid === -1) return out
    const meta = (tilesMeta as any)[String(tid)]
    const exits = (meta?.branches || []).filter((b: Branch) => b !== entry)
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
        if (occupiedByOther(nr, nc, selectedColor || undefined)) continue // blok overlap
        out.push({ r: nr, c: nc, dir })
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
    myExplorers, // supaya re-calc saat posisi explorer lain berubah
  ])

  // Set panah → dir lookup biar cell click bisa buka confirm
  const arrowsMap = useMemo(() => {
    const m = new Map<string, Dir>()
    for (const a of arrows) m.set(`${a.r},${a.c}`, a.dir)
    return m
  }, [arrows])

  // Temple target (tidak diblok oleh kemenangan pemain lain; hanya kalau SAYA sudah win temple itu)
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
        const winMine = winByMe.get(`N:${c}`) // kalau saya sudah win, jangan highlight
        if (!winMine) t.push({ side: "N", index: c, dir })
      }
      if (dir === "E" && c === 5) {
        const winMine = winByMe.get(`E:${r}`)
        if (!winMine) t.push({ side: "E", index: r, dir })
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

  const cellPx = (gr: number, gc: number) => ({
    left: GAP + gc * (CELL + GAP),
    top: GAP + gr * (CELL + GAP),
  })
  const cellCenter = (gr: number, gc: number) => {
    const p = cellPx(gr, gc)
    return { x: p.left + CELL / 2, y: p.top + CELL / 2 }
  }

  const BoardCell = ({ r6, c6 }: { r6: number; c6: number }) => {
    const tileId = board[r6][c6]
    const reward = tileId !== -1 ? rewards[tileId] : null

    const isPreviewHere =
      !!canPlace &&
      !!previewTileId &&
      !!previewAt &&
      previewAt.r === r6 &&
      previewAt.c === c6 &&
      tileId === -1

    useEffect(() => {
      if (isPreviewHere) {
        const previewMeta = (tilesMeta as any)[String(previewTileId!)]
        const previewImgId = previewMeta?.image ?? previewTileId
        dlog("PREVIEW @ cell", { r6, c6, previewTileId, previewImgId, previewMeta })
      }
    }, [isPreviewHere, r6, c6])

    const handleCellClick = () => {
      // PRIORITAS: kalau lagi memilih explorer → klik cell tujuan buat gerak
      if (selectedColor && myMoves > 0) {
        const k = `${r6},${c6}`
        const dir = arrowsMap.get(k)
        if (dir) {
          setConfirmMove({ color: selectedColor, dir })
          return
        }
      }

      // kalau nggak sedang gerak, baru urusan place tile
      if (!canPlace) return
      if (tileId !== -1) return
      if (isPreviewHere) {
        setConfirmPlace({ r: r6, c: c6 })
      } else {
        onPreview?.(r6, c6)
      }
    }

    const imgId =
      tileId !== -1 ? (tilesMeta as any)[String(tileId)]?.image ?? tileId : null
    const previewImgId =
      previewTileId != null
        ? (tilesMeta as any)[String(previewTileId)]?.image ?? previewTileId
        : null

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
          cursor: (selectedColor && myMoves > 0 && arrowsMap.has(`${r6},${c6}`))
            ? "pointer"
            : (canPlace && tileId === -1 ? "pointer" : "default"),
        }}
        onClick={handleCellClick}
        data-cell={`${r6},${c6}`}
      >
        {tileId !== -1 && imgId != null && (
          <img
            src={`/tiles/${imgId}.png`}
            alt={`Tile ${tileId}`}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", zIndex: 1 }}
          />
        )}

        {reward === "gold" && (
          <img
            src="/tiles/gold.png"
            alt="Gold"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", zIndex: 2 }}
          />
        )}
        {reward === "crystal" && (
          <img
            src="/tiles/crystal.png"
            alt="Crystal"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", zIndex: 2 }}
          />
        )}

        {isPreviewHere && (previewImgId != null) && (
          <>
            <img
              src={`/tiles/${previewImgId}.png`}
              alt={`Preview tile ${previewTileId}`}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", zIndex: 1, opacity: 0.95 }}
            />
            {(() => {
              const rw = rewards[previewTileId!]
              if (!rw) return null
              return (
                <img
                  src={`/tiles/${rw}.png`}
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

        {Object.values(myExplorers).map((ex) => {
          if (!ex.onBoard || ex.onBoard.r !== r6 || ex.onBoard.c !== c6) return null
          if (animGhost && ex.color === animGhost.color) return null
          const idx = colorIdx(ex.color)
          const isSelected = selectedColor === ex.color
          const canStep = myMoves > 0
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
                  if (!canStep || isAnimating) return
                  setSelectedColor(isSelected ? null : ex.color)
                }}
              />
            </React.Fragment>
          )
        })}
      </div>
    )
  }

  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: `repeat(8, ${CELL}px)`,
        gridTemplateRows: `repeat(8, ${CELL}px)`,
        gap: GAP,
        padding: GAP,
        background: "transparent",       // transparan (frame kelihatan)
        // border: "1px solid #e5e7eb",
        borderRadius: 10,
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        width: 8 * CELL + 7 * GAP + 2 * GAP,
      }}
      onClick={() => setSelectedColor(null)}
    >
      <style dangerouslySetInnerHTML={{ __html: `${BLINK_KEYFRAMES}` }} />

      {Array.from({ length: 8 }).map((_, r) =>
        Array.from({ length: 8 }).map((_, c) => {
          if ((r === 0 || r === 7) && (c === 0 || c === 7))
            return <div key={`g-${r}-${c}`} style={{ width: CELL, height: CELL }} />

          // TOP temples (N)
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
              <div key={`top-${c}`} style={{ width: CELL, height: CELL, position: "relative" }}>
                {t && showHighlight && (
                  <img src="/highlight.gif" alt="Temple highlight" style={highlightBottomCenterStyle} />
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
                      if (!showHighlight) return
                      e.stopPropagation()
                      if (!selectedColor || isAnimating) return
                      setConfirmTemple({ color: selectedColor, side: "N", index: c - 1 })
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
              <div key={`right-${r}`} style={{ width: CELL, height: CELL, position: "relative" }}>
                {t && showHighlight && (
                  <img src="/highlight.gif" alt="Temple highlight" style={highlightBottomCenterStyle} />
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
                      if (!showHighlight) return
                      e.stopPropagation()
                      if (!selectedColor || isAnimating) return
                      setConfirmTemple({ color: selectedColor, side: "E", index: r - 1 })
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
            if (!ex) return <div key={`left-${r}`} style={{ width: CELL, height: CELL }} />
            const idx = colorIdx(ex.color)
            const highlighted = canEnterFromEdge(ex) && myMoves > 0
            const isSelected = selectedColor === ex.color
            return (
              <div key={`left-${r}`} style={{ width: CELL, height: CELL, position: "relative" }}>
                {highlighted && isSelected && (
                  <img src="/highlight.gif" alt="highlight" style={highlightBottomCenterStyle} />
                )}
                {!isAnimating && (
                  <img
                    src={`/explorers/explorers_${idx}${ex.frame && ex.frame > 0 ? `_${ex.frame}` : ""}.svg`}
                    alt={`${ex.color} explorer`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!myMoves || !highlighted) return
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
            if (!ex) return <div key={`bottom-${c}`} style={{ width: CELL, height: CELL }} />
            const idx = colorIdx(ex.color)
            const highlighted = canEnterFromEdge(ex) && myMoves > 0
            const isSelected = selectedColor === ex.color
            return (
              <div key={`bottom-${c}`} style={{ width: CELL, height: CELL, position: "relative" }}>
                {highlighted && isSelected && (
                  <img src="/highlight.gif" alt="highlight" style={highlightBottomCenterStyle} />
                )}
                {!isAnimating && (
                  <img
                    src={`/explorers/explorers_${idx}${ex.frame && ex.frame > 0 ? `_${ex.frame}` : ""}.svg`}
                    alt={`${ex.color} explorer`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!myMoves || !highlighted) return
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
          return <BoardCell key={`cell-${r}-${c}`} r6={r6} c6={c6} />
        })
      )}

      {/* ARROWS */}
      {selectedColor &&
        !isAnimating &&
        arrows.length > 0 &&
        (() => {
          let origin8: { r: number; c: number } | null = null
          if (selected?.onEdge) {
            const { side, index } = selected.onEdge!
            origin8 =
              side === "W" ? { r: index + 1, c: 0 } :
              side === "S" ? { r: 7, c: index + 1 } :
              side === "E" ? { r: index + 1, c: 7 } :
                             { r: 0, c: index + 1 }
          } else if (selected?.onBoard) {
            origin8 = { r: selected.onBoard.r + 1, c: selected.onBoard.c + 1 }
          }
          if (!origin8) return null
          const oCenter = cellCenter(origin8.r, origin8.c)

          return (
            <>
              {arrows.map((a, i) => {
                const tCenter = cellCenter(a.r + 1, a.c + 1)
                const mid = { x: (oCenter.x + tCenter.x) / 2, y: (oCenter.y + tCenter.y) / 2 }
                return (
                  <img
                    key={`arr-${i}-${a.r}-${a.c}-${a.dir}`}
                    src={dirToArrowSrc(a.dir)}
                    alt={`arrow ${dirToName(a.dir)}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setConfirmMove({ color: selectedColor, dir: a.dir })
                    }}
                    style={{
                      position: "absolute",
                      left: mid.x - ARROW_SIZE / 2,
                      top: mid.y - ARROW_SIZE / 2,
                      width: ARROW_SIZE,
                      height: ARROW_SIZE,
                      zIndex: 4,
                      cursor: "pointer",
                      filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
                    }}
                  />
                )
              })}
            </>
          )
        })()}

      {/* GHOST anim */}
      {animGhost &&
        (() => {
          const idx = colorIdx(animGhost.color)
          const from = cellPx(animGhost.from8.r, animGhost.from8.c)
          const to = cellPx(animGhost.to8.r, animGhost.to8.c)
          const lerp = (a: number, b: number, t: number) => a + (b - a) * t
          const t = animGhost.stage === 1 ? 0 : animGhost.stage === 2 ? 0.5 : 1
          const left = lerp(from.left, to.left, t) + 4
          const top = lerp(from.top, to.top, t) + 4
          const src =
            animGhost.stage === 1
              ? `/explorers/explorers_${idx}_1.svg`
              : animGhost.stage === 2
              ? `/explorers/explorers_${idx}_2.svg`
              : `/explorers/explorers_${idx}_3.svg`

          return (
            <img
              key="ghost"
              src={src}
              alt="moving explorer"
              style={{
                position: "absolute",
                left,
                top,
                width: CELL - 8,
                height: CELL - 8,
                objectFit: "contain",
                transform: "scale(0.85)",
                transformOrigin: "center",
                zIndex: 10,
                pointerEvents: "none",
              }}
            />
          )
        })()}

      {confirmMove && (
        <Modal>
          <p>
            Move the <b>{confirmMove.color}</b> explorer{" "}
            <b>{dirToName(confirmMove.dir)}</b> 1 grid?
          </p>
          <ModalButtons
            onYes={() => {
              onMoveOne(confirmMove.color, confirmMove.dir)
              setConfirmMove(null)
              setSelectedColor(null)
            }}
            onCancel={() => setConfirmMove(null)}
          />
        </Modal>
      )}

      {confirmTemple && (
        <Modal>
          <p>
            Move the <b>{confirmTemple.color}</b> explorer into the temple?
          </p>
          <ModalButtons
            onYes={() => {
              onEnterTemple(confirmTemple.color, confirmTemple.side, confirmTemple.index)
              setConfirmTemple(null)
              setSelectedColor(null)
            }}
            onCancel={() => setConfirmTemple(null)}
          />
        </Modal>
      )}

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

function Modal({ children, width = 320 }: { children: React.ReactNode; width?: number }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 18,
          borderRadius: 10,
          width,
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        }}
      >
        {children}
      </div>
    </div>
  )
}
function ModalButtons({ onYes, onCancel }: { onYes: () => void; onCancel: () => void }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
      <button onClick={onYes}>Yes</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}