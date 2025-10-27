// src/game/gameEngine.ts - Main game engine for Welcome To

import type { GameState, Player, ConstructionCard, CityPlan, GameMode, StreetType } from './types';
import { createDeck, dealHands, drawCards } from './deck';
import { getRandomCityPlans } from './cityPlans';
import { calculateScore, checkCityPlanCompletion } from './scoring';

export function initializeGame(playerIds: string[], playerNames: string[], mode: GameMode = 'balanced'): GameState {
  const deck = createDeck();
  const availablePlans = getRandomCityPlans(3);

  // Deal 6 cards to each player initially
  const { hands, remaining: deckAfterDealing } = dealHands(deck, playerIds.length);

  const players: Record<string, Player> = {};
  playerIds.forEach((id, index) => {
    players[id] = {
      id,
      name: playerNames[index],
      color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'][index % 6],
      streets: {
        A: {
          type: 'A',
          houses: Array(10).fill(null).map(() => ({ number: null, hasPool: false, hasPark: false, hasFence: false }))
        },
        B: {
          type: 'B',
          houses: Array(11).fill(null).map(() => ({ number: null, hasPool: false, hasPark: false, hasFence: false }))
        },
        C: {
          type: 'C',
          houses: Array(12).fill(null).map(() => ({ number: null, hasPool: false, hasPark: false, hasFence: false }))
        }
      },
      hand: hands[index],
      cityPlans: availablePlans,
      completedPlans: [],
      tempAgencyUses: 0,
      bisCount: 0,
      buildingPermitRefusals: 0,
      score: 0
    };
  });

  return {
    id: `game-${Date.now()}`,
    players,
    currentPlayer: playerIds[0],
    deck: deckAfterDealing,
    discardPile: [],
    round: 1,
    status: 'playing',
    mode,
    availablePlans,
    startTime: Date.now()
  };
}

export function playCard(
  gameState: GameState,
  playerId: string,
  card: ConstructionCard,
  action: any
): GameState {
  if (gameState.currentPlayer !== playerId) {
    throw new Error('Not your turn');
  }

  const player = gameState.players[playerId];
  if (!player.hand.find(c => c.id === card.id)) {
    throw new Error('Card not in hand');
  }

  let newGameState = { ...gameState };
  let newPlayer = { ...player };

  // Execute the action based on card type
  if (card.type === 'number') {
    // Place house number
    const { street, houseIndex } = action;
    const streetKey = street as StreetType;
    const streetData = { ...newPlayer.streets[streetKey] };
    const houses = [...streetData.houses];

    // Validate placement
    if (houses[houseIndex]?.number !== null) {
      throw new Error('House slot already occupied');
    }

    // Check ascending order
    if (houseIndex > 0 && houses[houseIndex - 1]?.number !== null) {
      if (card.number! <= houses[houseIndex - 1].number!) {
        throw new Error('House numbers must be in ascending order');
      }
    }

    houses[houseIndex] = {
      ...houses[houseIndex],
      number: card.number!
    };

    streetData.houses = houses;
    newPlayer.streets[streetKey] = streetData;
  } else {
    // Execute effect
    switch (card.effect) {
      case 'pool':
        const { street: poolStreet, houseIndex: poolIndex } = action;
        const poolStreetKey = poolStreet as StreetType;
        const poolStreetData = { ...newPlayer.streets[poolStreetKey] };
        const poolHouses = [...poolStreetData.houses];
        if (poolHouses[poolIndex]?.number === null) {
          throw new Error('Cannot build pool on empty house');
        }
        poolHouses[poolIndex] = { ...poolHouses[poolIndex], hasPool: true };
        poolStreetData.houses = poolHouses;
        newPlayer.streets[poolStreetKey] = poolStreetData;
        break;

      case 'landscaper':
        const { street: parkStreet, houseIndex: parkIndex } = action;
        const parkStreetKey = parkStreet as StreetType;
        const parkStreetData = { ...newPlayer.streets[parkStreetKey] };
        const parkHouses = [...parkStreetData.houses];
        if (parkHouses[parkIndex]?.number === null) {
          throw new Error('Cannot build park on empty house');
        }
        parkHouses[parkIndex] = { ...parkHouses[parkIndex], hasPark: true };
        parkStreetData.houses = parkHouses;
        newPlayer.streets[parkStreetKey] = parkStreetData;
        break;

      case 'surveyor':
        const { startIndex, endIndex, street: fenceStreet } = action;
        const fenceStreetKey = fenceStreet as StreetType;
        const fenceStreetData = { ...newPlayer.streets[fenceStreetKey] };
        const fenceHouses = [...fenceStreetData.houses];
        for (let i = startIndex; i <= endIndex; i++) {
          if (fenceHouses[i]) {
            fenceHouses[i] = { ...fenceHouses[i], hasFence: true };
          }
        }
        fenceStreetData.houses = fenceHouses;
        newPlayer.streets[fenceStreetKey] = fenceStreetData;
        break;

      case 'temp-agency':
        newPlayer.tempAgencyUses += 1;
        break;

      case 'bis':
        newPlayer.bisCount += 1;
        break;

      case 'real-estate-agent':
        // This would affect scoring, but no immediate action needed
        break;
    }
  }

  // Remove card from hand
  newPlayer.hand = newPlayer.hand.filter(c => c.id !== card.id);

  // Add card to discard pile
  newGameState.discardPile = [...newGameState.discardPile, card];

  // Update player
  newGameState.players[playerId] = newPlayer;

  // Check for city plan completion
  newPlayer.cityPlans.forEach(plan => {
    if (!newPlayer.completedPlans.includes(plan.id) && checkCityPlanCompletion(newPlayer, plan)) {
      newPlayer.completedPlans.push(plan.id);
    }
  });

  // Calculate new score
  newPlayer.score = calculateScore(newPlayer, newGameState.mode);

  // Move to next player
  const playerIds = Object.keys(newGameState.players);
  const currentIndex = playerIds.indexOf(newGameState.currentPlayer);
  const nextIndex = (currentIndex + 1) % playerIds.length;
  newGameState.currentPlayer = playerIds[nextIndex];

  // If all players have played, start new round
  if (newGameState.currentPlayer === playerIds[0]) {
    newGameState.round += 1;

    // Deal new cards to players who still have space
    playerIds.forEach(id => {
      const p = newGameState.players[id];
      if (p.hand.length < 6 && newGameState.deck.length > 0) {
        const { drawn, remaining } = drawCards(newGameState.deck, 1);
        p.hand.push(...drawn);
        newGameState.deck = remaining;
      }
    });
  }

  return newGameState;
}

export function checkGameEnd(gameState: GameState): boolean {
  // Game ends when:
  // 1. A player has built all 33 houses
  // 2. A player has 3 building permit refusals
  // 3. All city plans are completed by at least one player

  for (const player of Object.values(gameState.players)) {
    // Check if player built all houses
    const totalHouses = Object.values(player.streets).reduce((sum, street) =>
      sum + street.houses.filter(h => h.number !== null).length, 0
    );
    if (totalHouses === 33) return true;

    // Check building permit refusals
    if (player.buildingPermitRefusals >= 3) return true;
  }

  // Check if all city plans are completed by at least one player
  const allPlansCompleted = gameState.availablePlans.every(plan =>
    Object.values(gameState.players).some(player =>
      player.completedPlans.includes(plan.id)
    )
  );
  if (allPlansCompleted) return true;

  return false;
}

export function finalizeGame(gameState: GameState): GameState {
  const newGameState = { ...gameState, status: 'finished' as const };

  // Final score calculation with any remaining bonuses
  Object.keys(newGameState.players).forEach(playerId => {
    const player = newGameState.players[playerId];
    player.score = calculateScore(player, newGameState.mode);
  });

  return newGameState;
}

export function getGameSummary(gameState: GameState): any {
  const players = Object.values(gameState.players)
    .sort((a, b) => b.score - a.score)
    .map(player => ({
      name: player.name,
      score: player.score,
      completedPlans: player.completedPlans.length,
      totalHouses: Object.values(player.streets).reduce((sum, street) =>
        sum + street.houses.filter(h => h.number !== null).length, 0
      )
    }));

  return {
    winner: players[0],
    players,
    roundsPlayed: gameState.round,
    duration: Date.now() - gameState.startTime
  };
}
