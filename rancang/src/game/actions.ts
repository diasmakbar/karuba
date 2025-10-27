// src/game/actions.ts - Effect Actions for Welcome To

import type { Player, StreetType, ConstructionCard, EffectType, GameState } from './types';

export function canPlayCard(card: ConstructionCard, player: Player): boolean {
  if (card.type === 'number') {
    // Can play number card if there's an empty house slot
    return hasEmptyHouseSlot(player);
  } else {
    // Effect cards can always be played (though some have restrictions)
    return true;
  }
}

export function hasEmptyHouseSlot(player: Player): boolean {
  for (const street of Object.values(player.streets)) {
    for (const house of street.houses) {
      if (house.number === null) {
        return true;
      }
    }
  }
  return false;
}

export function playNumberCard(
  player: Player,
  card: ConstructionCard,
  street: StreetType,
  houseIndex: number
): Player {
  if (card.type !== 'number' || !card.number) {
    throw new Error('Invalid card type for number action');
  }

  const newPlayer = { ...player };
  const streetData = { ...newPlayer.streets[street] };
  const houses = [...streetData.houses];

  if (houses[houseIndex]?.number !== null) {
    throw new Error('House slot is already occupied');
  }

  // Check if number can be placed (must be higher than previous house in street)
  if (houseIndex > 0 && houses[houseIndex - 1]?.number !== null) {
    const prevNumber = houses[houseIndex - 1].number!;
    if (card.number <= prevNumber) {
      throw new Error(`House number ${card.number} must be higher than previous house ${prevNumber}`);
    }
  }

  houses[houseIndex] = {
    ...houses[houseIndex],
    number: card.number
  };

  streetData.houses = houses;
  newPlayer.streets[street] = streetData;

  // Remove card from hand
  newPlayer.hand = newPlayer.hand.filter(c => c.id !== card.id);

  return newPlayer;
}

export function playEffectCard(
  player: Player,
  card: ConstructionCard,
  gameState: GameState,
  params?: any
): { player: Player; gameState: GameState } {
  if (card.type !== 'effect' || !card.effect) {
    throw new Error('Invalid card type for effect action');
  }

  let newPlayer = { ...player };
  let newGameState = { ...gameState };

  switch (card.effect) {
    case 'pool':
      newPlayer = playPoolEffect(newPlayer, params.street, params.houseIndex);
      break;
    case 'temp-agency':
      newPlayer = playTempAgencyEffect(newPlayer);
      break;
    case 'bis':
      newPlayer = playBISEffect(newPlayer);
      break;
    case 'landscaper':
      newPlayer = playLandscaperEffect(newPlayer, params.street, params.houseIndex);
      break;
    case 'real-estate-agent':
      newPlayer = playRealEstateAgentEffect(newPlayer, params.estateSize);
      break;
    case 'surveyor':
      newPlayer = playSurveyorEffect(newPlayer, params.startIndex, params.endIndex, params.street);
      break;
  }

  // Remove card from hand
  newPlayer.hand = newPlayer.hand.filter(c => c.id !== card.id);

  return { player: newPlayer, gameState: newGameState };
}

function playPoolEffect(player: Player, street: StreetType, houseIndex: number): Player {
  const newPlayer = { ...player };
  const streetData = { ...newPlayer.streets[street] };
  const houses = [...streetData.houses];

  if (!houses[houseIndex] || houses[houseIndex].number === null) {
    throw new Error('Cannot build pool on empty house');
  }

  if (houses[houseIndex].hasPool) {
    throw new Error('Pool already exists on this house');
  }

  houses[houseIndex] = {
    ...houses[houseIndex],
    hasPool: true
  };

  streetData.houses = houses;
  newPlayer.streets[street] = streetData;

  return newPlayer;
}

function playTempAgencyEffect(player: Player): Player {
  const newPlayer = { ...player };
  newPlayer.tempAgencyUses += 1;
  return newPlayer;
}

function playBISEffect(player: Player): Player {
  const newPlayer = { ...player };
  newPlayer.bisCount += 1;
  return newPlayer;
}

function playLandscaperEffect(player: Player, street: StreetType, houseIndex: number): Player {
  const newPlayer = { ...player };
  const streetData = { ...newPlayer.streets[street] };
  const houses = [...streetData.houses];

  if (!houses[houseIndex] || houses[houseIndex].number === null) {
    throw new Error('Cannot build park on empty house');
  }

  if (houses[houseIndex].hasPark) {
    throw new Error('Park already exists on this house');
  }

  houses[houseIndex] = {
    ...houses[houseIndex],
    hasPark: true
  };

  streetData.houses = houses;
  newPlayer.streets[street] = streetData;

  return newPlayer;
}

function playRealEstateAgentEffect(player: Player, estateSize: number): Player {
  // This effect increases the value of estates of the chosen size
  // The actual scoring happens later, this just marks that the effect was used
  const newPlayer = { ...player };
  // Could add a flag or counter for real estate agent usage
  return newPlayer;
}

function playSurveyorEffect(player: Player, startIndex: number, endIndex: number, street: StreetType): Player {
  const newPlayer = { ...player };
  const streetData = { ...newPlayer.streets[street] };
  const houses = [...streetData.houses];

  // Place fences to create estate boundaries
  for (let i = startIndex; i <= endIndex; i++) {
    if (houses[i]) {
      houses[i] = {
        ...houses[i],
        hasFence: true
      };
    }
  }

  streetData.houses = houses;
  newPlayer.streets[street] = streetData;

  return newPlayer;
}

export function getAvailableActions(card: ConstructionCard, player: Player): any[] {
  if (card.type === 'number') {
    return getAvailableNumberPlacements(player);
  } else {
    return getAvailableEffectActions(card.effect!, player);
  }
}

function getAvailableNumberPlacements(player: Player): any[] {
  const actions = [];

  for (const [streetType, street] of Object.entries(player.streets) as [StreetType, any][]) {
    for (let i = 0; i < street.houses.length; i++) {
      if (street.houses[i].number === null) {
        // Check if number can be placed here
        if (i === 0 || street.houses[i - 1].number !== null) {
          actions.push({
            type: 'place-number',
            street: streetType,
            houseIndex: i
          });
        }
      }
    }
  }

  return actions;
}

function getAvailableEffectActions(effect: EffectType, player: Player): any[] {
  switch (effect) {
    case 'pool':
    case 'landscaper':
      return getAvailablePoolParkPlacements(player);
    case 'temp-agency':
    case 'bis':
      return [{ type: 'use-effect' }];
    case 'real-estate-agent':
      return [{ type: 'choose-estate-size', sizes: [1, 2, 3, 4, 5, 6] }];
    case 'surveyor':
      return getAvailableFencePlacements(player);
    default:
      return [];
  }
}

function getAvailablePoolParkPlacements(player: Player): any[] {
  const actions = [];

  for (const [streetType, street] of Object.entries(player.streets) as [StreetType, any][]) {
    for (let i = 0; i < street.houses.length; i++) {
      const house = street.houses[i];
      if (house.number !== null && !house.hasPool && !house.hasPark) {
        actions.push({
          type: 'place-pool-park',
          street: streetType,
          houseIndex: i
        });
      }
    }
  }

  return actions;
}

function getAvailableFencePlacements(player: Player): any[] {
  const actions = [];

  for (const [streetType, street] of Object.entries(player.streets) as [StreetType, any][]) {
    for (let i = 0; i < street.houses.length - 1; i++) {
      if (street.houses[i].number !== null && street.houses[i + 1].number !== null) {
        actions.push({
          type: 'place-fence',
          street: streetType,
          startIndex: i,
          endIndex: i + 1
        });
      }
    }
  }

  return actions;
}
