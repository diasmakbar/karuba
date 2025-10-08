export const BOARD_CONFIG = {
  CELL_SIZE: 56,
  GAP_SIZE: 6,
  GRID_SIZE: 6,
  TOTAL_CELLS: 8, // Including temple spaces
  HIGHLIGHT_DIAMETER: 38,
  HIGHLIGHT_CENTER_FROM_BOTTOM: 8,
  HIGHLIGHT_EXTRA_SHIFT_Y: 0,
  HIGHLIGHT_OPACITY: 0.75,
  ARROW_SIZE: 28,
} as const

export const ANIMATION_CONFIG = {
  CONFIRM_BLINK_KEYFRAMES: `
    @keyframes confirmBlink {
      0%   { opacity: .15; }
      45%  { opacity: 1;   }
      55%  { opacity: 1;   }
      100% { opacity: .15; }
    }
  `,
  GHOST_STAGE_DURATION: {
    0: 100,
    1: 200,
    2: 200,
    3: 200,
    4: 50,
    5: 100,
  },
} as const

export const Z_INDEX = {
  GRID: 0,
  TILE: 1,
  REWARD: 2,
  HIGHLIGHT: 3,
  ARROW: 4,
  EXPLORER: 5,
  GHOST: 10,
} as const
