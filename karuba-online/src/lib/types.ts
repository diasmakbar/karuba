export type TileNumber = number
export type Cell = -1 | TileNumber
export type Board = Cell[][]

export type Color = "brown" | "blue" | "yellow" | "purple"

export interface Pos { r: number; c: number }

export interface Player {
  name: string
  joinedAt: number
  board: Board
  usedTiles: Record<string, boolean>
  explorers: Record<Color, Pos>
  score: number
  doneForRound?: boolean
}

export interface Game {
  status: "lobby" | "active" | "ended"
  createdAt: number
  deck: TileNumber[]
  round: number
  currentTile: TileNumber | null
  shuffleTurnUid: string
  boardSize: number
  rules: { noRotation: true; infiniteRewards: true }
  temples: Record<Color, Pos>
  explorersStart: Record<Color, Pos>
  templeTokens: Record<Color, number[]>
  rewards: Record<number, "gold" | "crystal" | null>
  players: Record<string, Player>
}
