import type { PlayerBoard, StreetId } from './types';

// Check if can place house number in street at position
export function canPlaceHouse(
  board: PlayerBoard,
  street: StreetId,
  position: number,
  number: number
): boolean {
  const streetKey = `street${street}` as keyof PlayerBoard;
  const streetArray = board[streetKey];

  if (position < 0 || position >= streetArray.length) return false;

  // Slot must be empty
  if (streetArray[position].number) return false;

  // Check ascending order: previous houses must be lower numbers
  for (let i = 0; i < position; i++) {
    const prevNumber = streetArray[i].number;
    if (prevNumber && prevNumber >= number) return false;
  }

  // Check descending order: next houses must be higher numbers
  for (let i = position + 1; i < streetArray.length; i++) {
    const nextNumber = streetArray[i].number;
    if (nextNumber && nextNumber <= number) return false;
  }

  return true;
}

// Place house
export function placeHouse(
  board: PlayerBoard,
  street: StreetId,
  position: number,
  number: number
): PlayerBoard {
  const newBoard = JSON.parse(JSON.stringify(board)); // deep copy
  const streetKey = `street${street}` as keyof PlayerBoard;
  newBoard[streetKey][position].number = number;
  return newBoard;
}

// Check if can use effect
export function canUseEffect(
  board: PlayerBoard,
  effect: string,
  street?: StreetId,
  position?: number
): boolean {
  // Basic validation - will expand
  switch (effect) {
    case 'pool':
      if (!street || position === undefined) return false;
      const streetKey = `street${street}` as keyof PlayerBoard;
      return board[streetKey][position].number !== undefined && !board[streetKey][position].hasPool;
    case 'temp':
      return true; // can always adjust
    case 'bis':
      return true; // can always duplicate
    case 'landscaper':
      return true; // can always add park
    case 'realEstate':
      return true; // can always upgrade
    case 'surveyor':
      return true; // can always add fence
    default:
      return false;
  }
}

// Apply effect
export function applyEffect(
  board: PlayerBoard,
  effect: string,
  street?: StreetId,
  position?: number,
  params?: any
): PlayerBoard {
  const newBoard = JSON.parse(JSON.stringify(board));

  switch (effect) {
    case 'pool':
      if (street && position !== undefined) {
        const streetKey = `street${street}` as keyof PlayerBoard;
        newBoard[streetKey][position].hasPool = true;
      }
      break;
    case 'temp':
      // Adjust number ±1 or ±2
      if (street && position !== undefined && params?.adjustment) {
        const streetKey = `street${street}` as keyof PlayerBoard;
        const current = newBoard[streetKey][position].number;
        if (current) {
          newBoard[streetKey][position].number = Math.max(1, Math.min(15, current + params.adjustment));
        }
      }
      break;
    case 'bis':
      // Duplicate adjacent house
      if (street && position !== undefined && params?.targetPosition !== undefined) {
        const streetKey = `street${street}` as keyof PlayerBoard;
        const targetNumber = newBoard[streetKey][params.targetPosition].number;
        if (targetNumber && !newBoard[streetKey][position].number) {
          newBoard[streetKey][position].number = targetNumber;
        }
      }
      break;
    // Add more effects...
  }

  return newBoard;
}
