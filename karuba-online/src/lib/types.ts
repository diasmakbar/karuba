export type Status = "waiting" | "playing" | "ended"
export type Branch = "N" | "E" | "S" | "W"
export type Board = number[][] // 6x6, -1 = empty, >0 = tileId (1..36)

export type ExplorerColor = "blue" | "yellow" | "brown" | "red"

export interface TileMeta {
  branches: Branch[] // e.g. ["N","S"] or ["N","E","W"]
}
export type TilesMetaMap = Record<string, TileMeta> // key = tileId as string

export interface ExplorerEdge {
  side: Branch // "W"=A2..A7, "S"=B8..G8, "E"=H2..H7, "N"=B1..G1
  index: number // 0..5
}

export interface ExplorerOnBoard {
  r: number
  c: number
  entry: Branch
}

export interface ExplorerState {
  color: ExplorerColor
  onEdge?: ExplorerEdge
  onBoard?: ExplorerOnBoard
  isAnimating?: boolean
  frame?: 0 | 1 | 2 | 3
}

export interface Player {
  id: string
  name: string
  joinedAt: number
  board: Board
  score: number

  // NEW: flow round
  actedForRound: boolean   // sudah place ATAU discard
  doneForRound: boolean    // sudah klik "Ready for Next Round"

  moves: number
  lastDiscardDirs?: Branch[]
  usedTiles?: Record<number, true>
  explorers: Record<ExplorerColor, ExplorerState>
  discardedTiles?: number[]
}

export interface GameLayout {
  explorersStart: ExplorerState[] // 4 explorer: 2 di W + 2 di S
  temples: { side: Branch; index: number; color: ExplorerColor }[] // 2 di E + 2 di N
}

export interface Game {
  id: string
  status: Status
  statusText: string
  createdAt: number

  round: number          // 0 saat belum mulai, lalu 1..36
  currentTile: number    // 0 artinya belum ditampilkan di round tsb
  deck: number[]

  generateTurnIndex: number // 0..(players-1)
  generateTurnUid: string
  shuffleTurnUid: string

  boardSize: number // 6
  rules: { noRotation: boolean; infiniteRewards: boolean }

  layout: GameLayout

  rewards: Record<number, "gold" | "crystal" | null>
  playersCount: number

  players?: Record<string, Player>
}
