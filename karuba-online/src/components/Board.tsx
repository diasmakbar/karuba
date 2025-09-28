import React, { useState, Fragment } from "react"
import type {
  Board,
  Branch,
  ExplorerState,
  ExplorerColor,
  TilesMetaMap,
} from "../lib/types"

const CELL = 48 // px

function opposite(b: Branch): Branch {
  return b === "N" ? "S" : b === "S" ? "N" : b === "E" ? "W" : "E"
}

// Mapping warna -> index file explorers_{idx}.svg
// 1=merah, 2=biru, 3=coklat, 4=kuning
const explorerIdx = (color: ExplorerColor) =>
  ({ red: 1, blue: 2, brown: 3, yellow: 4 } as const)[color]

export default function Board({
  board,
  tilesMeta,
  rewards,
  canPlace,
  canDiscard,
  onPlace,
  onDiscard,
  currentTile,
  myMoves,
  myExplorers,
  layoutExplorers,
  temples,
  onExplorerStep,
  discardedTiles,
}: {
  board: Board
  tilesMeta: TilesMetaMap
  rewards: Record<number, "gold" | "crystal" | null>
  canPlace: boolean
  canDiscard: boolean
  onPlace: (r: number, c: number) => void
  onDiscard: (tileId: number, branches: Branch[]) => void
  currentTile: number
  myMoves: number
  myExplorers: Record<ExplorerColor, ExplorerState>
  layoutExplorers: ExplorerState[]
  temples: { side: Branch; index: number; color: ExplorerColor }[]
  onExplorerStep: (color: ExplorerColor) => void
  discardedTiles: number[]
}) {
  const [confirmPlace, setConfirmPlace] = useState<{ r: number; c: number } | null>(null)
  const [confirmMove, setConfirmMove] = useState<ExplorerColor | null>(null)
  const [showDiscardList, setShowDiscardList] = useState(false)

  const handleCellClick = (r: number, c: number) => {
    if (!canPlace) return
    if (board[r][c] !== -1) return
    setConfirmPlace({ r, c })
  }

  const doPlace = () => {
    if (!confirmPlace) return
    onPlace(confirmPlace.r, confirmPlace.c)
    setConfirmPlace(null)
  }

  const canExplorerEnter = (e: ExplorerState): boolean => {
    if (!e.onEdge) return false
    const { side, index } = e.onEdge
    if (side === "W") {
      const tile = board[index][0]
      if (tile === -1) return false
      return tilesMeta[String(tile)]?.branches?.includes("W") ?? false
    }
    if (side === "S") {
      const tile = board[5][index]
      if (tile === -1) return false
      return tilesMeta[String(tile)]?.branches?.includes("S") ?? false
    }
    if (side === "E") {
      const tile = board[index][5]
      if (tile === -1) return false
      return tilesMeta[String(tile)]?.branches?.includes("E") ?? false
    }
    // "N"
    const tile = board[0][index]
    if (tile === -1) return false
    return tilesMeta[String(tile)]?.branches?.includes("N") ?? false
  }

  const handleExplorerClick = (color: ExplorerColor) => {
    if (myMoves <= 0) return
    setConfirmMove(color)
  }

  const onClickTrash = () => {
    if (!canDiscard || currentTile <= 0) return
    const meta = tilesMeta[String(currentTile)]
    const branches = meta?.branches || []
    onDiscard(currentTile, branches)
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(9, ${CELL}px)`, gap: 6 }}>
      {/* Row 1: temples top (N) → B1..G1 */}
      {Array.from({ length: 9 }).map((_, c) => (
        <div key={`r0c${c}`} style={{ width: CELL, height: CELL, position: "relative" }}>
          {c >= 1 && c <= 6 ? (
            (() => {
              const t = temples.find((t) => t.side === "N" && t.index === c - 1)
              return t ? (
                <img
                  src={`/temples/temples_${explorerIdx(t.color)}_top.svg`}
                  alt={`Temple ${t.color}`}
                  style={{ position: "absolute", inset: 0, objectFit: "contain" }}
                />
              ) : null
            })()
          ) : null}
        </div>
      ))}

      {/* Row 2..7 */}
      {Array.from({ length: 6 }).map((_, r) => (
        <Fragment key={`row-${r}`}>
          {/* A2..A7 explorers W */}
          <div style={{ width: CELL, height: CELL, position: "relative" }}>
            {layoutExplorers.some((e) => e.onEdge?.side === "W" && e.onEdge.index === r) ? (
              (() => {
                const color =
                  layoutExplorers.find((e) => e.onEdge?.side === "W" && e.onEdge.index === r)!.color
                const meState = myExplorers[color]
                const highlighted = canExplorerEnter(meState)
                const idx = explorerIdx(color)
                return (
                  <>
                    {highlighted && (
                      <img
                        src="/highlight.gif"
                        alt="highlight"
                        style={{ position: "absolute", inset: 0, objectFit: "contain", zIndex: 3 }}
                      />
                    )}
                    <img
                      onClick={() => highlighted && myMoves > 0 && handleExplorerClick(color)}
                      src={`/explorers/explorers_${idx}${
                        meState.frame && meState.frame > 0 ? `_${meState.frame}` : ""
                      }.svg`}
                      alt={`${color} explorer`}
                      style={{
                        position: "absolute",
                        inset: 0,
                        objectFit: "contain",
                        zIndex: 4,
                        cursor: highlighted && myMoves > 0 ? "pointer" : "default",
                      }}
                    />
                  </>
                )
              })()
            ) : null}
          </div>

          {/* B2..G7 board */}
          {Array.from({ length: 6 }).map((_, c) => {
            const cell = board[r][c]
            const reward = cell !== -1 ? rewards[cell] : null
            return (
              <div
                key={`cell-${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                style={{
                  width: CELL,
                  height: CELL,
                  position: "relative",
                  border: "1px solid #ddd",
                  background: "#fff",
                  cursor: canPlace && cell === -1 ? "pointer" : "default",
                  overflow: "hidden",
                }}
              >
                {/* tile */}
                {cell !== -1 && (
                  <img
                    src={`/tiles/${cell}.png`}
                    alt={`Tile ${cell}`}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "contain", // fit ke kotak
                      display: "block",
                      zIndex: 1,
                    }}
                  />
                )}

                {/* reward (di atas tile) */}
                {reward === "gold" && (
                  <img
                    src="/tiles/gold.png"
                    alt="Gold"
                    style={{
                      position: "absolute",
                      bottom: 2,
                      right: 2,
                      width: 16,
                      height: 16,
                      zIndex: 2,
                    }}
                  />
                )}
                {reward === "crystal" && (
                  <img
                    src="/tiles/crystal.png"
                    alt="Crystal"
                    style={{
                      position: "absolute",
                      bottom: 2,
                      right: 2,
                      width: 16,
                      height: 16,
                      zIndex: 2,
                    }}
                  />
                )}

                {/* explorer on-board */}
                {Object.values(myExplorers).map((ex) => {
                  if (!ex.onBoard) return null
                  if (ex.onBoard.r !== r || ex.onBoard.c !== c) return null
                  const idx = explorerIdx(ex.color)
                  return (
                    <React.Fragment key={`ex-${ex.color}-${r}-${c}`}>
                      {myMoves > 0 && (
                        <img
                          src="/highlight.gif"
                          alt="highlight"
                          style={{ position: "absolute", inset: 0, objectFit: "contain", zIndex: 3 }}
                        />
                      )}
                      <img
                        src={`/explorers/explorers_${idx}${
                          ex.frame && ex.frame > 0 ? `_${ex.frame}` : ""
                        }.svg`}
                        alt={`${ex.color} explorer`}
                        style={{
                          position: "absolute",
                          inset: 0,
                          objectFit: "contain",
                          zIndex: 4,
                          display: "block",
                        }}
                        onClick={() => myMoves > 0 && setConfirmMove(ex.color)}
                      />
                    </React.Fragment>
                  )
                })}
              </div>
            )
          })}

          {/* H2..H7 temples E */}
          <div style={{ width: CELL, height: CELL, position: "relative" }}>
            {temples.some((t) => t.side === "E" && t.index === r) ? (
              (() => {
                const t = temples.find((t) => t.side === "E" && t.index === r)!
                return (
                  <img
                    src={`/temples/temples_${explorerIdx(t.color)}_side.svg`}
                    alt={`Temple ${t.color}`}
                    style={{ position: "absolute", inset: 0, objectFit: "contain" }}
                  />
                )
              })()
            ) : null}
          </div>
        </Fragment>
      ))}

      {/* Row 8: B8..G8 explorers S, I2 trash & moves */}
      {Array.from({ length: 9 }).map((_, c) => (
        <div key={`r8c${c}`} style={{ width: CELL, height: CELL, position: "relative" }}>
          {c >= 1 && c <= 6 ? (
            layoutExplorers.some((e) => e.onEdge?.side === "S" && e.onEdge.index === c - 1) ? (
              (() => {
                const color =
                  layoutExplorers.find((e) => e.onEdge?.side === "S" && e.onEdge.index === c - 1)!.color
                const meState = myExplorers[color]
                const highlighted = canExplorerEnter(meState)
                const idx = explorerIdx(color)
                return (
                  <>
                    {highlighted && (
                      <img
                        src="/highlight.gif"
                        alt="highlight"
                        style={{ position: "absolute", inset: 0, objectFit: "contain", zIndex: 3 }}
                      />
                    )}
                    <img
                      onClick={() => highlighted && myMoves > 0 && handleExplorerClick(color)}
                      src={`/explorers/explorers_${idx}${
                        meState.frame && meState.frame > 0 ? `_${meState.frame}` : ""
                      }.svg`}
                      alt={`${color} explorer`}
                      style={{
                        position: "absolute",
                        inset: 0,
                        objectFit: "contain",
                        zIndex: 4,
                        cursor: highlighted && myMoves > 0 ? "pointer" : "default",
                      }}
                    />
                  </>
                )
              })()
            ) : null
          ) : c === 8 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <img
                src="/trash.svg"
                alt="Trash"
                title={currentTile > 0 && canDiscard ? `Discard tile #${currentTile}` : "No tile to discard"}
                onClick={onClickTrash}
                style={{
                  width: CELL,
                  height: CELL,
                  cursor: currentTile > 0 && canDiscard ? "pointer" : "default",
                }}
              />
              <div style={{ fontSize: 12, textAlign: "center" }}>Moves: {myMoves}</div>
              <button onClick={() => setShowDiscardList(true)} style={{ fontSize: 12 }}>
                View Discard
              </button>
            </div>
          ) : null}
        </div>
      ))}

      {/* Modal place */}
      {confirmPlace && (
        <div style={modalBackdrop}>
          <div style={modalCard}>
            <p>Place tile #{currentTile} here?</p>
            <div style={modalButtons}>
              <button onClick={doPlace}>Yes</button>
              <button onClick={() => setConfirmPlace(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal move explorer */}
      {confirmMove && (
        <div style={modalBackdrop}>
          <div style={modalCard}>
            <p>Move the {confirmMove} explorer?</p>
            <div style={modalButtons}>
              <button
                onClick={() => {
                  onExplorerStep(confirmMove!)
                  setConfirmMove(null)
                }}
              >
                Yes
              </button>
              <button onClick={() => setConfirmMove(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal discarded tiles */}
      {showDiscardList && (
        <div style={modalBackdrop}>
          <div style={{ ...modalCard, width: 360 }}>
            <h4 style={{ marginTop: 0 }}>Discarded Tiles</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {discardedTiles?.length ? (
                discardedTiles.map((tid, i) => (
                  <img key={`${tid}-${i}`} src={`/tiles/${tid}.png`} alt={`tile ${tid}`} style={{ width: 40, height: 40 }} />
                ))
              ) : (
                <div>No discarded tiles</div>
              )}
            </div>
            <div style={modalButtons}>
              <button onClick={() => setShowDiscardList(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const modalBackdrop: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
}
const modalCard: React.CSSProperties = {
  background: "white",
  padding: 20,
  borderRadius: 8,
  minWidth: 280,
}
const modalButtons: React.CSSProperties = {
  display: "flex",
  gap: 8,
  justifyContent: "center",
  marginTop: 12,
}
