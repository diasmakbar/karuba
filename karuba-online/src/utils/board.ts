import type { Branch, ExplorerColor } from "../lib/types"

// Shared utility (same as room.ts)
export const opp = (b: Branch): Branch => (b === "N" ? "S" : b === "S" ? "N" : b === "E" ? "W" : "E")

// Board specific utils
export const colorIdx = (color: ExplorerColor) =>
  ({ red: 1, blue: 2, brown: 3, yellow: 4 } as const)[color]

type Dir = Branch
export const dirToName = (d: Dir) =>
  d === "N" ? "top" : d === "E" ? "right" : d === "S" ? "down" : "left"
export const dirToArrowSrc = (d: Dir) => `/arrows/arrow_${dirToName(d)}.svg`
