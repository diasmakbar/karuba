export const TILES: number[] = Array.from({ length: 36 }, (_, i) => i + 1)

export function shuffle<T>(arr: T[], seed = Date.now()): T[] {
  const a = arr.slice()
  let s = seed % 2147483647; if (s <= 0) s += 2147483646
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647
    const j = Math.floor((s / 2147483647) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function tileDegree(tile: number): 2 | 3 | 4 {
  if (tile <= 21) return 2
  if (tile <= 30) return 3
  return 4
}
