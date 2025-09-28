import { useMemo, useState } from "react"
import type { Board, Branch, ExplorerState, ExplorerColor, TilesMetaMap } from "../lib/types"

const CELL = 48 // px

function opposite(b: Branch): Branch {
  return b === "N" ? "S" : b === "S" ? "N" : b === "E" ? "W" : "E"
}

export default function Board({
  board,
  tilesMeta,
  rewards,
  canPlace,
  onPlace,
  onDiscard,
  currentTile,
  myMoves,
  myExplorers,
  layoutExplorers, // dari game.layout.explorersStart (untuk posisi edge referensi warna)
  temples,
  onExplorerStep,   // (color) => boolean (true jika berhasil jalan satu step & consume 1 move)
  discardedTiles,   // number[] untuk modal
}: {
  board: Board
  tilesMeta: TilesMetaMap
  rewards: Record<number, "gold" | "crystal" | null>
  canPlace: boolean
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
  // modal state
  const [confirmPlace, setConfirmPlace] = useState<{ r: number; c: number } | null>(null)
  const [confirmMove, setConfirmMove] = useState<ExplorerColor | null>(null)
  const [showDiscardList, setShowDiscardList] = useState(false)

  // clickable handler
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
    // cari tile adjacent
    if (side === "W") {
      const tile = board[index][0]
      if (tile === -1) return false
      const meta = tilesMeta[String(tile)]
      return meta?.branches?.includes("W") ?? false
    }
    if (side === "S") {
      const tile = board[5][index]
      if (tile === -1) return false
      const meta = tilesMeta[String(tile)]
      return meta?.branches?.includes("S") ?? false
    }
    if (side === "E") {
      const tile = board[index][5]
      if (tile === -1) return false
      const meta = tilesMeta[String(tile)]
      return meta?.branches?.includes("E") ?? false
    }
    // "N"
    const tile = board[0][index]
    if (tile === -1) return false
    const meta = tilesMeta[String(tile)]
    return meta?.branches?.includes("N") ?? false
  }

  const handleExplorerClick = (color: ExplorerColor) => {
    if (myMoves <= 0) return
    setConfirmMove(color)
  }

  // panel kanan (trash & moves)
  const onClickTrash = () => {
    if (currentTile <= 0) return
    const meta = tilesMeta[String(currentTile)]
    const branches = meta?.branches || []
    // konfirmasi discard
    if (window.confirm(`Discard tile #${currentTile}? You will gain +${branches.length} moves (${branches.join(",")}).`)) {
      onDiscard(currentTile, branches)
    }
  }

  // layout wrapper: grid 8x9 = (rows: 8, cols: 9)
  // kita render board 6x6 mulai dari (row=1,col=1) secara visual → B2..G7
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(9, ${CELL}px)`, gap: 6 }}>
      {/* Row 1 (index 0): kolom 2..7 = temples atas (N) */}
      {Array.from({ length: 9 }).map((_, c) => (
        <div key={`r0c${c}`} style={{ width: CELL, height: CELL, position: "relative" }}>
          {c >= 1 && c <= 6 ? (
            // posisi B1..G1 → temples N dengan index (c-1)
            (() => {
              const t = temples.find(t => t.side === "N" && t.index === (c - 1))
              return t ? (
                <img
                  src={`/temples_${["blue","yellow","brown","red"].indexOf(t.color)+1}.png`}
                  alt={`Temple ${t.color}`}
                  style={{ position: "absolute", inset: 0, objectFit: "contain" }}
                />
              ) : null
            })()
          ) : null}
        </div>
      ))}

      {/* Row 2..7: kiri (A2..A7) explorers W, kolom 2..7 board 6x6, kolom 8 temples E */}
      {Array.from({ length: 6 }).map((_, r) => (
        <>
          {/* A2..A7 = explorers W untuk index r */}
          <div key={`edgeW-${r}`} style={{ width: CELL, height: CELL, position: "relative" }}>
            {layoutExplorers.some(e => e.onEdge?.side === "W" && e.onEdge.index === r) ? (
              (() => {
                // cari warna sesuai layout
                const color = layoutExplorers.find(e => e.onEdge?.side === "W" && e.onEdge.index === r)!.color
                const meState = myExplorers[color]
                const highlighted = canExplorerEnter(meState)
                return (
                  <>
                    {highlighted && (
                      <img
                        src="/highlight.gif"
                        alt="highlight"
                        style={{ position: "absolute", inset: 0, objectFit: "contain", zIndex: 1 }}
                      />
                    )}
                    <img
                      onClick={() => highlighted && myMoves > 0 && handleExplorerClick(color)}
                      src={`/explorers_${["blue","yellow","brown","red",""].indexOf(color)+1}.png`}
                      alt={`${color} explorer`}
                      style={{ position: "absolute", inset: 0, objectFit: "contain", zIndex: 2, cursor: highlighted && myMoves>0 ? "pointer" : "default" }}
                    />
                  </>
                )
              })()
            ) : null}
          </div>

          {/* B2..G7 = board cells */}
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
                  cursor: canPlace && cell === -1 ? "pointer" : "default"
                }}
              >
                {/* grid base */}
                {/* tile */}
                {cell !== -1 && (
                  <img
                    src={`/tiles/${cell}.png`}
                    alt={`Tile ${cell}`}
                    style={{ position: "absolute", inset: 0, objectFit: "cover", zIndex: 0 }}
                  />
                )}
                {/* reward */}
                {reward === "gold" && (
                  <img
                    src="/tiles/gold.png"
                    alt="Gold"
                    style={{ position: "absolute", bottom: 2, right: 2, width: 16, height: 16, zIndex: 1 }}
                  />
                )}
                {reward === "crystal" && (
                  <img
                    src="/tiles/crystal.png"
                    alt="Crystal"
                    style={{ position: "absolute", bottom: 2, right: 2, width: 16, height: 16, zIndex: 1 }}
                  />
                )}
                {/* explorer on-board (jika posisi sama dengan (r,c)) */}
                {Object.values(myExplorers).map((ex) => {
                  if (!ex.onBoard) return null
                  if (ex.onBoard.r !== r || ex.onBoard.c !== c) return null
                  const idx = ["blue","yellow","brown","red"].indexOf(ex.color) + 1
                  return (
                    <>
                      {/* highlight kalau bisa lanjut (punya moves & ada path keluar yang valid) */}
                      {myMoves > 0 && (
                        <img
                          key={`hl-${ex.color}-${r}-${c}`}
                          src="/highlight.gif"
                          alt="highlight"
                          style={{ position: "absolute", inset: 0, objectFit: "contain", zIndex: 2 }}
                        />
                      )}
                      <img
                        key={`ex-${ex.color}-${r}-${c}`}
                        src={`/explorers_${idx}${ex.frame && ex.frame>0 ? `_${ex.frame}` : ""}.png`}
                        alt={`${ex.color} explorer`}
                        style={{ position: "absolute", inset: 0, objectFit: "contain", zIndex: 3 }}
                        onClick={() => myMoves>0 && setConfirmMove(ex.color)}
                      />
                    </>
                  )
                })}
              </div>
            )
          })}

          {/* H2..H7 = temples E untuk index r */}
          <div key={`edgeE-${r}`} style={{ width: CELL, height: CELL, position: "relative" }}>
            {temples.some(t => t.side === "E" && t.index === r) ? (
              (() => {
                const t = temples.find(t => t.side === "E" && t.index === r)!
                return (
                  <img
                    src={`/temples_${["blue","yellow","brown","red"].indexOf(t.color)+1}.png`}
                    alt={`Temple ${t.color}`}
                    style={{ position: "absolute", inset: 0, objectFit: "contain" }}
                  />
                )
              })()
            ) : null}
          </div>
        </>
      ))}

      {/* Row 8: kolom 2..7 explorers S (B8..G8), kolom 9 = trash/moves */}
      {Array.from({ length: 9 }).map((_, c) => (
        <div key={`r8c${c}`} style={{ width: CELL, height: CELL, position: "relative" }}>
          {c >= 1 && c <= 6 ? (
            layoutExplorers.some(e => e.onEdge?.side === "S" && e.onEdge.index === (c - 1)) ? (
              (() => {
                const color = layoutExplorers.find(e => e.onEdge?.side === "S" && e.onEdge.index === (c - 1))!.color
                const meState = myExplorers[color]
                const highlighted = canExplorerEnter(meState)
                return (
                  <>
                    {highlighted && (
                      <img
                        src="/highlight.gif"
                        alt="highlight"
                        style={{ position: "absolute", inset: 0, objectFit: "contain", zIndex: 1 }}
                      />
                    )}
                    <img
                      onClick={() => highlighted && myMoves > 0 && handleExplorerClick(color)}
                      src={`/explorers_${["blue","yellow","brown","red",""].indexOf(color)+1}.png`}
                      alt={`${color} explorer`}
                      style={{ position: "absolute", inset: 0, objectFit: "contain", zIndex: 2, cursor: highlighted && myMoves>0 ? "pointer" : "default" }}
                    />
                  </>
                )
              })()
            ) : null
          ) : c === 8 ? (
            // I2 = trash (di baris ke-2 sebenarnya, tapi utk ringkas kita letakkan di row terakhir col terakhir)
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <img
                src="/trash.png"
                alt="Trash"
                title={currentTile>0 ? `Discard tile #${currentTile}` : "No tile to discard"}
                onClick={onClickTrash}
                style={{ width: CELL, height: CELL, cursor: currentTile>0 ? "pointer" : "default" }}
              />
              <div style={{ fontSize: 12, textAlign: "center" }}>Moves: {myMoves}</div>
              <button onClick={()=>setShowDiscardList(true)} style={{ fontSize: 12 }}>View Discard</button>
            </div>
          ) : null}
        </div>
      ))}

      {/* Modal konfirmasi place */}
      {confirmPlace && (
        <div style={modalBackdrop}>
          <div style={modalCard}>
            <p>Place tile #{currentTile} here?</p>
            <div style={modalButtons}>
              <button onClick={doPlace}>Yes</button>
              <button onClick={()=>setConfirmPlace(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal konfirmasi move explorer */}
      {confirmMove && (
        <div style={modalBackdrop}>
          <div style={modalCard}>
            <p>Move the {confirmMove} explorer?</p>
            <div style={modalButtons}>
              <button onClick={() => { onExplorerStep(confirmMove); setConfirmMove(null) }}>Yes</button>
              <button onClick={()=>setConfirmMove(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal daftar discard */}
      {showDiscardList && (
        <div style={modalBackdrop}>
          <div style={{ ...modalCard, width: 360 }}>
            <h4 style={{ marginTop: 0 }}>Discarded Tiles</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {discardedTiles?.length ? discardedTiles.map((tid, i) => (
                <img key={`${tid}-${i}`} src={`/tiles/${tid}.png`} alt={`tile ${tid}`} style={{ width: 40, height: 40 }} />
              )) : <div>No discarded tiles</div>}
            </div>
            <div style={modalButtons}>
              <button onClick={()=>setShowDiscardList(false)}>Close</button>
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
  zIndex: 1000
}
const modalCard: React.CSSProperties = {
  background: "white",
  padding: 20,
  borderRadius: 8,
  minWidth: 280
}
const modalButtons: React.CSSProperties = {
  display: "flex",
  gap: 8,
  justifyContent: "center",
  marginTop: 12
}
