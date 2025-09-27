export type Status = "waiting" | "playing" | "ended"

export type Board = number[][] // -1 = empty, otherwise tile id (1..36)

export type RewardsMap = Record<number, "gold" | "crystal" | null>

export interface Player {
  id: string
  name: string
  joinedAt: number
  board: Board
  score: number
  doneForRound: boolean
  usedTiles?: Record<number, true>
  // Placeholder explorer (spawn di luar grid; implementasi movement nanti)
  explorer?: {
    side: "N" | "E" | "S" | "W" // sisi luar tempat spawn
    x?: number
    y?: number
  }
}

export interface Game {
  id: string
  status: Status
  statusText: string
  round: number        // mulai 0, lalu 1..36
  currentTile: number  // mulai 0, lalu 1..36
  deck: number[]       // 1..36 shuffled saat Start Game
  rewards: RewardsMap  // mapping tileId -> reward
  shuffleTurnUid: string // host id (tetap dipakai sbg host/room owner)
  playersCount: number    // cache utk auto next round
}


// export type TileNumber = number
// export type Cell = -1 | TileNumber
// export type Board = Cell[][]

// export type Color = "brown" | "blue" | "yellow" | "purple"

// export interface Pos { r: number; c: number }

// export interface Player {
//   name: string
//   joinedAt: number
//   board: Board
//   usedTiles: Record<string, boolean>
//   explorers: Record<Color, Pos>
//   score: number
//   doneForRound?: boolean
// }

// export interface Game {
//   status: "lobby" | "active" | "ended"
//   createdAt: number
//   deck: TileNumber[]
//   round: number
//   currentTile: TileNumber | null
//   shuffleTurnUid: string
//   boardSize: number
//   rules: { noRotation: true; infiniteRewards: true }
//   temples: Record<Color, Pos>
//   explorersStart: Record<Color, Pos>
//   templeTokens: Record<Color, number[]>
//   rewards: Record<number, "gold" | "crystal" | null>
//   players: Record<string, Player>
// }
