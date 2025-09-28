export type Status = "waiting" | "playing" | "ended"
export type Branch = "N" | "E" | "S" | "W"
export type Board = number[][] // 6x6, -1 = empty, >0 = tileId (1..36)

export type ExplorerColor = "blue" | "yellow" | "brown" | "red"

export interface TileMeta {
  branches: Branch[] // e.g. ["N","S"] or ["N","E","W"]
}
export type TilesMetaMap = Record<string, TileMeta> // key = tileId as string

// Posisi explorer saat masih di tepi (off-board), "index" paralel dgn baris/kolom board
export interface ExplorerEdge {
  side: Branch // "W" untuk A2..A7, "S" untuk B8..G8, "E" untuk H2..H7, "N" untuk B1..G1
  index: number // 0..5
}

// Posisi explorer di dalam board
export interface ExplorerOnBoard {
  r: number
  c: number
  entry: Branch // sisi dari tile tempat dia masuk (untuk kalkulasi keluar)
}

export interface ExplorerState {
  color: ExplorerColor
  // salah satu dari dua ini aktif
  onEdge?: ExplorerEdge
  onBoard?: ExplorerOnBoard
  // untuk UX animasi lokal (tidak disimpan di RTDB)
  isAnimating?: boolean
  frame?: 0 | 1 | 2 | 3
}

export interface Player {
  id: string
  name: string
  joinedAt: number
  board: Board
  score: number
  doneForRound: boolean
  moves: number
  lastDiscardDirs?: Branch[]
  usedTiles?: Record<number, true>
  explorers: Record<ExplorerColor, ExplorerState>
  // riwayat discard untuk modal
  discardedTiles?: number[]
}

export interface GameLayout {
  // sama untuk semua pemain → ditentukan saat create game
  explorersStart: ExplorerState[]         // 4 explorer: 2 di W (A2..A7) + 2 di S (B8..G8)
  temples: { side: Branch; index: number; color: ExplorerColor }[] // 4 temple: 2 di E, 2 di N
}

export interface Game {
  id: string
  status: Status
  statusText: string
  createdAt: number

  round: number          // 0 saat belum mulai, lalu 1..36
  currentTile: number    // 0 artinya belum ditampilkan di round tsb
  deck: number[]         // 1..36 acak

  // rotasi generator: index & uid pemain yang berhak "Generate Tile" pada round ≥2
  generateTurnIndex: number // 0..(players-1)
  generateTurnUid: string

  // host/owner room (id pemain yang buat room)
  shuffleTurnUid: string

  boardSize: number // 6
  rules: { noRotation: boolean; infiniteRewards: boolean }

  layout: GameLayout

  rewards: Record<number, "gold" | "crystal" | null> // tileId -> reward
  playersCount: number

  players?: Record<string, Player>
}
