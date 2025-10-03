export type Status = "waiting" | "playing" | "ended"
export type Branch = "N" | "E" | "S" | "W"
export type Board = number[][] // 6x6, -1 = empty, >0 = tileId

export type ExplorerColor = "blue" | "yellow" | "brown" | "red"

export interface TileMeta {
  branches: Branch[] // e.g. ["N","S"] or ["N","E","W"]
}
export type TilesMetaMap = Record<string, TileMeta>
export type RewardsMap = Record<number, "gold" | "crystal" | null>

export interface ExplorerEdge {
  side: Branch // "W"=A2..A7, "S"=B8..G8, "E"=H2..H7, "N"=B1..G1
  index: number // 0..5
}

export interface ExplorerOnBoard {
  r: number
  c: number
  entry: Branch // sisi dari mana dia MASUK ke tile ini
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

  actedForRound: boolean     // sudah place/discard
  doneForRound: boolean      // sudah klik "Ready"
  lastAction: "placed" | "discarded" | null

  moves: number
  lastDiscardDirs?: Branch[]
  usedTiles?: Record<number, true>
  explorers: Record<ExplorerColor, ExplorerState>
  discardedTiles?: number[]
  // === New fields ===
  // claimedRewards?: Record<number, boolean>
  claimedRewards?: Record<ExplorerColor, Record<number, boolean>>
  finishedAtRound?: number | null
  bonusPoints?: number
}

export interface GameLayout {
  explorersStart: ExplorerState[] // 4 explorer: 2 di W + 2 di S
  temples: { side: Branch; index: number; color: ExplorerColor }[] // 2 di E + 2 di N
}

export interface TempleWin {
  side: Branch // "N" (top) atau "E" (right)
  index: number // 0..5
  color: ExplorerColor
  playerId: string
  order: number // 1=pertama, 2,3,4
}

export interface Game {
  id: string
  status: Status
  statusText: string
  createdAt: number

  round: number          // 0 saat belum mulai
  currentTile: number    // 0 artinya belum ditampilkan di round tsb
  deck: number[]

  generateTurnIndex: number
  generateTurnUid: string
  shuffleTurnUid: string

  boardSize: number
  rules: { noRotation: boolean; infiniteRewards: boolean }

  layout: GameLayout

  rewards: Record<number, "gold" | "crystal" | null>
  playersCount: number

  templeWins?: TempleWin[] // siapa yg sudah "menang" di temple (ubah asset)
  players?: Record<string, Player>
}
