import React, { useMemo, useState } from "react"
import type {
  Board, Branch, ExplorerState, ExplorerColor, TilesMetaMap, TempleWin
} from "../lib/types"

const CELL = 56
const GAP = 6

// file mapping: 1=red, 2=blue, 3=brown, 4=yellow
const colorIdx = (color: ExplorerColor) =>
  ({ red: 1, blue: 2, brown: 3, yellow: 4 } as const)[color]

const opp = (b: Branch): Branch => (b === "N" ? "S" : b === "S" ? "N" : b === "E" ? "W" : "E")

type Dir = Branch
const dirToName = (d: Dir) => (d === "N" ? "top" : d === "E" ? "right" : d === "S" ? "down" : "left")
const dirToArrowSrc = (d: Dir) => `/arrows/arrow_${dirToName(d)}.svg`

export default function Board({
  board, tilesMeta, rewards,
  canPlace, onPlace,
  myMoves, myExplorers,
  temples, templeWins = [],
  onMoveOne, onEnterTemple,
  animGhost
}: {
  board: Board
  tilesMeta: TilesMetaMap
  rewards: Record<number, "gold" | "crystal" | null>
  canPlace: boolean
  onPlace: (r: number, c: number) => void
  myMoves: number
  myExplorers: Record<ExplorerColor, ExplorerState>
  temples: { side: Branch; index: number; color: ExplorerColor }[]
  templeWins?: TempleWin[]
  onMoveOne: (color: ExplorerColor, dir: Dir) => void
  onEnterTemple: (color: ExplorerColor, side: Branch, index: number) => void
  // animasi ghost (koordinat dalam grid 8x8, 0..7)
  animGhost?: {
    color: ExplorerColor
    from8: { r: number; c: number }
    to8: { r: number; c: number }
    stage: 1 | 2 | 3 // 1=start, 2=middle, 3=finish (di sel tujuan)
  } | null
}) {
  const [confirmPlace, setConfirmPlace] = useState<{ r: number; c: number } | null>(null)
  const [confirmMove, setConfirmMove] = useState<{ color: ExplorerColor; dir: Dir } | null>(null)
  const [confirmTemple, setConfirmTemple] = useState<{ color: ExplorerColor; side: Branch; index: number } | null>(null)
  const [selectedColor, setSelectedColor] = useState<ExplorerColor | null>(null)

  // temple lookup helpers
  const winKey = (side: Branch, index: number) => `${side}:${index}`
  const winMap = useMemo(() => {
    const m = new Map<string, TempleWin>()
    for (const w of templeWins) m.set(winKey(w.side, w.index), w)
    return m
  }, [templeWins])

  const findTemple = (side: Branch, index: number) =>
    temples.find(t => t.side === side && t.index === index)

  // selection helpers
  const handleCellClick = (r6: number, c6: number) => {
    if (!canPlace) return
    if (board[r6][c6] !== -1) return
    setConfirmPlace({ r: r6, c: c6 })
  }
  const doPlace = () => { if (confirmPlace) { onPlace(confirmPlace.r, confirmPlace.c); setConfirmPlace(null) } }

  const canEnterFromEdge = (e: ExplorerState): boolean => {
    if (!e.onEdge) return false
    const { side, index } = e.onEdge
    if (side === "W") { const t = board[index][0]; return t !== -1 && !!tilesMeta[String(t)]?.branches?.includes("W") }
    if (side === "S") { const t = board[5][index]; return t !== -1 && !!tilesMeta[String(t)]?.branches?.includes("S") }
    if (side === "E") { const t = board[index][5]; return t !== -1 && !!tilesMeta[String(t)]?.branches?.includes("E") }
    const t = board[0][index]; return t !== -1 && !!tilesMeta[String(t)]?.branches?.includes("N")
  }

  const edgeExplorerAt = (side: Branch, idx: number): ExplorerState | null => {
    const ex = Object.values(myExplorers).find(e => e.onEdge && e.onEdge.side === side && e.onEdge.index === idx)
    return ex || null
  }

  // === compute ARROWS for selected explorer ===
  type Arrow = { r: number; c: number; dir: Dir } // board coords (6x6)
  type TempleTarget = { side: Branch; index: number; dir: Dir }

  const selected = selectedColor ? myExplorers[selectedColor] : undefined
  const isAnimating = !!animGhost

  const arrows: Arrow[] = useMemo(() => {
    if (isAnimating) return []
    const out: Arrow[] = []
    if (!selectedColor || myMoves <= 0 || !selected) return out

    // a) explorer di EDGE → satu arrow masuk
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
      const meta = tilesMeta[String(tid)]
      if (!meta?.branches?.includes(side)) return out
      out.push({ r, c, dir: opp(side) })
      return out
    }

    // b) explorer di dalam board → arrows ke neighbor valid
    if (!selected.onBoard) return out
    const { r, c, entry } = selected.onBoard
    const tid = board[r][c]
    if (tid === -1) return out
    const meta = tilesMeta[String(tid)]
    const exits = (meta?.branches || []).filter(b => b !== entry)
    for (const dir of exits) {
      let nr = r, nc = c
      if (dir === "N") nr = r - 1
      if (dir === "S") nr = r + 1
      if (dir === "E") nc = c + 1
      if (dir === "W") nc = c - 1
      if (nr >= 0 && nr < 6 && nc >= 0 && nc < 6) {
        const ntid = board[nr][nc]
        if (ntid === -1) continue
        const nmeta = tilesMeta[String(ntid)]
        if (!nmeta?.branches?.includes(opp(dir))) continue
        out.push({ r: nr, c: nc, dir })
      }
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating, selectedColor, selected?.onBoard?.r, selected?.onBoard?.c, selected?.onBoard?.entry, selected?.onEdge?.side, selected?.onEdge?.index, board, myMoves])

  const templeTargets: TempleTarget[] = useMemo(() => {
    if (isAnimating) return []
    const t: TempleTarget[] = []
    if (!selectedColor || !selected?.onBoard || myMoves <= 0) return t
    const { r, c, entry } = selected.onBoard
    const tid = board[r][c]
    if (tid === -1) return t
    const meta = tilesMeta[String(tid)]
    const exits = (meta?.branches || []).filter(b => b !== entry)

    for (const dir of exits) {
      if (dir === "N" && r === 0) {
        const temp = findTemple("N", c)
        if (temp && temp.color === selectedColor && !winMap.get(winKey("N", c))) {
          t.push({ side: "N", index: c, dir })
        }
      }
      if (dir === "E" && c === 5) {
        const temp = findTemple("E", r)
        if (temp && temp.color === selectedColor && !winMap.get(winKey("E", r))) {
          t.push({ side: "E", index: r, dir })
        }
      }
    }
    return t
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating, selectedColor, selected?.onBoard?.r, selected?.onBoard?.c, selected?.onBoard?.entry, board, temples, myMoves, templeWins])

  // Helper: posisi pixel untuk cell 8x8
  const cellPx = (gr: number, gc: number) => ({
    left: GAP + gc * (CELL + GAP),
    top: GAP + gr * (CELL + GAP),
  })

  // ====== 1 cell 6×6 board ======
  const BoardCell = ({ r6, c6 }: { r6: number; c6: number }) => {
    const tileId = board[r6][c6]
    const reward = tileId !== -1 ? rewards[tileId] : null
    const arrowHere = arrows.find(a => a.r === r6 && a.c === c6)

    return (
      <div
        style={{
          width: CELL, height: CELL, position: "relative",
          border: "1px solid #e5e7eb", background: "#fff",
          borderRadius: 6, overflow: "hidden",
          cursor: canPlace && tileId === -1 ? "pointer" : "default",
        }}
        onClick={() => handleCellClick(r6, c6)}
      >
        {/* TILE */}
        {tileId !== -1 && (
          <img
            src={`/tiles/${tileId}.png`}
            alt={`Tile ${tileId}`}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", zIndex: 1 }}
          />
        )}

        {/* REWARD OVERLAY (full) */}
        {reward === "gold" && (
          <img src="/tiles/gold.png" alt="Gold"
               style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", zIndex: 2 }} />
        )}
        {reward === "crystal" && (
          <img src="/tiles/crystal.png" alt="Crystal"
               style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", zIndex: 2 }} />
        )}

        {/* explorer on tile (hide when animating this color) */}
        {Object.values(myExplorers).map((ex) => {
          if (!ex.onBoard || ex.onBoard.r !== r6 || ex.onBoard.c !== c6) return null
          if (animGhost && ex.color === animGhost.color) return null // sementara disembunyikan
          const idx = colorIdx(ex.color)
          const isSelected = selectedColor === ex.color
          const canStep = myMoves > 0
          const frameSuffix = ex.frame && ex.frame > 0 ? `_${ex.frame}` : ""
          return (
            <React.Fragment key={`ex-${ex.color}-${r6}-${c6}`}>
              {canStep && isSelected && (
                <img
                  src="/highlight.gif"
                  alt="highlight"
                  style={{
                    position: "absolute",
                    inset: 4,
                    width: "calc(100% - 8px)",
                    height: "calc(100% - 8px)",
                    objectFit: "contain",
                    zIndex: 3,
                    opacity: 0.75,
                  }}
                />
              )}
              <img
                src={`/explorers/explorers_${idx}${frameSuffix}.svg`}
                alt={`${ex.color} explorer`}
                style={{
                  position: "absolute",
                  inset: 4,
                  width: "calc(100% - 8px)",
                  height: "calc(100% - 8px)",
                  objectFit: "contain",
                  transform: "scale(0.85)",
                  transformOrigin: "center",
                  zIndex: 4,
                  display: "block",
                  cursor: canStep ? "pointer" : "default",
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

        {/* ARROW di cell target */}
        {arrowHere && selectedColor && !isAnimating && (
          <img
            src={dirToArrowSrc(arrowHere.dir)}
            alt={`arrow ${dirToName(arrowHere.dir)}`}
            onClick={(e) => {
              e.stopPropagation()
              setConfirmMove({ color: selectedColor, dir: arrowHere.dir })
            }}
            style={{
              position: "absolute",
              inset: 0,
              margin: "auto",
              width: 30,
              height: 30,
              zIndex: 6,
              cursor: "pointer",
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
            }}
          />
        )}
      </div>
    )
  }

  // ====== 8×8 grid: perimeter untuk explorers/temples ======
  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: `repeat(8, ${CELL}px)`,
        gridTemplateRows: `repeat(8, ${CELL}px)`,
        gap: GAP,
        padding: GAP,
        background: "#fafafa",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        width: 8 * CELL + 7 * GAP + 2 * GAP,
      }}
      onClick={() => setSelectedColor(null)}
    >
      {Array.from({ length: 8 }).map((_, r) =>
        Array.from({ length: 8 }).map((_, c) => {
          // corners kosong
          if ((r === 0 || r === 7) && (c === 0 || c === 7)) return <div key={`g-${r}-${c}`} style={{ width: CELL, height: CELL }} />

          // TOP temples N (B1..G1)
          if (r === 0 && c >= 1 && c <= 6) {
            const t = temples.find((t) => t.side === "N" && t.index === c - 1)
            const win = winMap.get(winKey("N", c - 1))
            const color = win ? win.color : t?.color
            const idx = color ? colorIdx(color) : 0
            const showHighlight =
              selectedColor &&
              !win &&
              templeTargets.some(tt => tt.side === "N" && tt.index === c - 1 && myExplorers[selectedColor!]?.onBoard)

            return (
              <div key={`top-${c}`} style={{ width: CELL, height: CELL, position: "relative" }}>
                {t && !win && (
                  <img
                    src={`/temples/temples_${idx}_top.svg`}
                    alt={`Temple ${color}`}
                    style={{ position: "absolute", inset: 4, width: "calc(100% - 8px)", height: "calc(100% - 8px)", objectFit: "contain", zIndex: 1 }}
                  />
                )}
                {win && (
                  <img
                    src={`/temples/win_${idx}_top.svg`}
                    alt={`Temple win ${color}`}
                    style={{ position: "absolute", inset: 4, width: "calc(100% - 8px)", height: "calc(100% - 8px)", objectFit: "contain", zIndex: 1 }}
                  />
                )}
                {showHighlight && (
                  <img
                    src={`/temples/temples_${idx}_top_highlighted.svg`}
                    alt="Temple highlight"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!selectedColor || isAnimating) return
                      setConfirmTemple({ color: selectedColor, side: "N", index: c - 1 })
                    }}
                    style={{
                      position: "absolute",
                      inset: 4,
                      width: "calc(100% - 8px)",
                      height: "calc(100% - 8px)",
                      objectFit: "contain",
                      zIndex: 2,
                      cursor: "pointer",
                    }}
                  />
                )}
              </div>
            )
          }

          // RIGHT temples E (H2..H7)
          if (c === 7 && r >= 1 && r <= 6) {
            const t = temples.find((t) => t.side === "E" && t.index === r - 1)
            const win = winMap.get(winKey("E", r - 1))
            const color = win ? win.color : t?.color
            const idx = color ? colorIdx(color) : 0
            const showHighlight =
              selectedColor &&
              !win &&
              templeTargets.some(tt => tt.side === "E" && tt.index === r - 1 && myExplorers[selectedColor!]?.onBoard)

            return (
              <div key={`right-${r}`} style={{ width: CELL, height: CELL, position: "relative" }}>
                {t && !win && (
                  <img
                    src={`/temples/temples_${idx}_side.svg`}
                    alt={`Temple ${color}`}
                    style={{ position: "absolute", inset: 4, width: "calc(100% - 8px)", height: "calc(100% - 8px)", objectFit: "contain", zIndex: 1 }}
                  />
                )}
                {win && (
                  <img
                    src={`/temples/win_${idx}_side.svg`}
                    alt={`Temple win ${color}`}
                    style={{ position: "absolute", inset: 4, width: "calc(100% - 8px)", height: "calc(100% - 8px)", objectFit: "contain", zIndex: 1 }}
                  />
                )}
                {showHighlight && (
                  <img
                    src={`/temples/temples_${idx}_side_highlighted.svg`}
                    alt="Temple highlight"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!selectedColor || isAnimating) return
                      setConfirmTemple({ color: selectedColor, side: "E", index: r - 1 })
                    }}
                    style={{
                      position: "absolute",
                      inset: 4,
                      width: "calc(100% - 8px)",
                      height: "calc(100% - 8px)",
                      objectFit: "contain",
                      zIndex: 2,
                      cursor: "pointer",
                    }}
                  />
                )}
              </div>
            )
          }

          // LEFT explorers W (A2..A7)
          if (c === 0 && r >= 1 && r <= 6) {
            const ex = edgeExplorerAt("W", r - 1)
            if (!ex) return <div key={`left-${r}`} style={{ width: CELL, height: CELL }} />
            const idx = colorIdx(ex.color)
            const highlighted = canEnterFromEdge(ex) && myMoves > 0
            const isSelected = selectedColor === ex.color
            return (
              <div key={`left-${r}`} style={{ width: CELL, height: CELL, position: "relative" }}>
                {highlighted && isSelected && (
                  <img
                    src="/highlight.gif"
                    alt="highlight"
                    style={{
                      position: "absolute",
                      inset: 4,
                      width: "calc(100% - 8px)",
                      height: "calc(100% - 8px)",
                      objectFit: "contain",
                      zIndex: 2,
                      opacity: 0.75,
                    }}
                  />
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
                    style={{
                      position: "absolute",
                      inset: 4,
                      width: "calc(100% - 8px)",
                      height: "calc(100% - 8px)",
                      objectFit: "contain",
                      transform: "scale(0.85)",
                      transformOrigin: "center",
                      zIndex: 3,
                      cursor: highlighted ? "pointer" : "default",
                    }}
                  />
                )}
              </div>
            )
          }

          // BOTTOM explorers S (B8..G8)
          if (r === 7 && c >= 1 && c <= 6) {
            const ex = edgeExplorerAt("S", c - 1)
            if (!ex) return <div key={`bottom-${c}`} style={{ width: CELL, height: CELL }} />
            const idx = colorIdx(ex.color)
            const highlighted = canEnterFromEdge(ex) && myMoves > 0
            const isSelected = selectedColor === ex.color
            return (
              <div key={`bottom-${c}`} style={{ width: CELL, height: CELL, position: "relative" }}>
                {highlighted && isSelected && (
                  <img
                    src="/highlight.gif"
                    alt="highlight"
                    style={{
                      position: "absolute",
                      inset: 4,
                      width: "calc(100% - 8px)",
                      height: "calc(100% - 8px)",
                      objectFit: "contain",
                      zIndex: 2,
                      opacity: 0.75,
                    }}
                  />
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
                    style={{
                      position: "absolute",
                      inset: 4,
                      width: "calc(100% - 8px)",
                      height: "calc(100% - 8px)",
                      objectFit: "contain",
                      transform: "scale(0.85)",
                      transformOrigin: "center",
                      zIndex: 3,
                      cursor: highlighted ? "pointer" : "default",
                    }}
                  />
                )}
              </div>
            )
          }

          // INNER 6×6
          const r6 = r - 1, c6 = c - 1
          return <BoardCell key={`cell-${r}-${c}`} r6={r6} c6={c6} />
        })
      )}

      {/* GHOST ANIMATION overlay (absolute in board) */}
      {animGhost && (() => {
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

      {/* Modal konfirmasi move 1 grid */}
      {confirmMove && (
        <Modal>
          <p>
            Move the <b>{confirmMove.color}</b> explorer <b>{dirToName(confirmMove.dir)}</b> 1 grid?
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

      {/* Modal konfirmasi masuk temple */}
      {confirmTemple && (
        <Modal>
          <p>Move the <b>{confirmTemple.color}</b> explorer into the temple?</p>
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

      {/* Modal place tile */}
      {confirmPlace && (
        <Modal>
          <p>Place tile here?</p>
          <ModalButtons onYes={doPlace} onCancel={() => setConfirmPlace(null)} />
        </Modal>
      )}
    </div>
  )
}

function Modal({ children, width = 320 }: { children: React.ReactNode; width?: number }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", padding: 18, borderRadius: 10, width, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
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