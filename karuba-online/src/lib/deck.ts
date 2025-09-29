// Deck generator: only use public/tiles 1..11
// and build 36 tiles with required proportions + randomized numbering 1..36.

export type Branch = "N" | "E" | "S" | "W"

type TileMeta = { branches: Branch[]; image: number }
export type TilesMetaMap = Record<string, TileMeta>

/**
 * Build 36 tiles meta with this proportion:
 * - Straight (NS/EW) = 12 → split (6,6) or jitters (5,7) / (7,5)
 * - Corner (NE,ES,SW,NW) = 6 → pick any 2 orientations get 2 each, rest 1 each
 * - T-junction (NES,ESW,NEW,NSW) = 10 → pick any 2 get 3 each, the other 2 get 2 each
 * - 4-way (NEWS) = 8
 * Then shuffle and label them 1..36 (these are the round numbers).
 * Each entry keeps `image` = 1..11 according to orientation.
 */
export function generateTilesMeta(): TilesMetaMap {
  const pick = <T,>(arr: T[], k: number) => {
    const a = [...arr]
    const res: T[] = []
    for (let i = 0; i < k && a.length; i++) {
      const j = Math.floor(Math.random() * a.length)
      res.push(a.splice(j, 1)[0])
    }
    return res
  }

  // --- Straight split (NS, EW) total 12
  const straightSplits: [number, number][] = [
    [6, 6],
    [5, 7],
    [7, 5],
  ]
  const [nsCount, ewCount] = straightSplits[Math.floor(Math.random() * straightSplits.length)]

  // --- Corner split (NE, ES, SW, NW) total 6
  // const cornerDirs: Array<["N" | "E" | "S" | "W", "N" | "E" | "S" | "W"]> = [
  //   ["N", "E"], // NE
  //   ["E", "S"], // ES
  //   ["S", "W"], // SW
  //   ["N", "W"], // NW
  // ]
  const cornerDirs: Array<["N" | "E" | "S" | "W", "N" | "E" | "S" | "W"]> = [
    ["N", "E"], // NE image 3
    ["S", "W"], // SW image 4
    ["N", "W"], // NW image 5  
    ["E", "S"], // ES image 6
  ]
  const cornerPick2 = pick([0, 1, 2, 3], 2) // these get 2 each, the others get 1
  const cornerCounts = [0, 0, 0, 0]
  for (let i = 0; i < 4; i++) cornerCounts[i] = cornerPick2.includes(i) ? 2 : 1
  // sum(cornerCounts) = 6

  // --- T-junction split (NES, ESW, NEW, NSW) total 10
  const tNames = ["NES", "ESW", "NEW", "NSW"] as const
  const tPick2 = pick([0, 1, 2, 3], 2) // these get 3 each, the others get 2
  const tCounts = [0, 0, 0, 0]
  for (let i = 0; i < 4; i++) tCounts[i] = tPick2.includes(i) ? 3 : 2
  // sum(tCounts) = 10

  // --- 4-way total 8
  const fourCount = 8

  // helpers
  const pushMany = (arr: TileMeta[], count: number, branches: Branch[], image: number) => {
    for (let i = 0; i < count; i++) arr.push({ branches, image })
  }

  const all: TileMeta[] = []

  // Straights: image 1 (NS), 2 (EW)
  pushMany(all, nsCount, ["N", "S"], 1)
  pushMany(all, ewCount, ["E", "W"], 2)

  // Corners: image 3..6 = NE, ES, SW, NW
  const cornerImages = [3, 4, 5, 6]
  cornerCounts.forEach((cnt, i) => {
    const [a, b] = cornerDirs[i]
    pushMany(all, cnt, [a as Branch, b as Branch], cornerImages[i])
  })

  // T: image 7..10 = NES, ESW, NEW, NSW
  const tBranches: Branch[][] = [
    ["N", "E", "S"], // NES
    ["E", "S", "W"], // ESW
    ["N", "E", "W"], // NEW
    ["N", "S", "W"], // NSW
  ]
  for (let i = 0; i < 4; i++) {
    pushMany(all, tCounts[i], tBranches[i], 7 + i)
  }

  // 4-way: image 11
  pushMany(all, fourCount, ["N", "E", "S", "W"], 11)

  // Sanity check: 12 + 6 + 10 + 8 = 36
  if (all.length !== 36) {
    // fallback (shouldn't happen)
    while (all.length < 36) all.push({ branches: ["N", "E", "S", "W"], image: 11 })
    all.length = 36
  }

  // Shuffle and assign ids 1..36
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[all[i], all[j]] = [all[j], all[i]]
  }

  const result: TilesMetaMap = {}
  all.forEach((meta, i) => {
    const id = String(i + 1) // round number
    result[id] = meta
  })
  return result
}