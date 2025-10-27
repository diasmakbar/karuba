// src/game/scoring.ts - Scoring System for Welcome To

import type { Player, StreetType, GameMode, CityPlan } from './types';

export function calculateScore(player: Player, mode: GameMode): number {
  let totalScore = 0;

  // Calculate estate scores
  totalScore += calculateEstateScore(player);

  // Calculate pool scores
  totalScore += calculatePoolScore(player);

  // Calculate park scores
  totalScore += calculateParkScore(player);

  // Calculate BIS penalties
  totalScore += calculateBISPenalty(player);

  // Calculate building permit refusal penalties
  totalScore += calculatePermitPenalty(player);

  // Calculate city plan bonuses
  totalScore += calculateCityPlanScore(player, mode);

  return totalScore;
}

export function calculateEstateScore(player: Player): number {
  let score = 0;

  for (const streetType of ['A', 'B', 'C'] as StreetType[]) {
    const estates = findEstates(player, streetType);
    for (const estate of estates) {
      score += getEstateValue(estate.size);
    }
  }

  return score;
}

export function calculatePoolScore(player: Player): number {
  let totalScore = 0;

  for (const streetType of ['A', 'B', 'C'] as StreetType[]) {
    const street = player.streets[streetType];
    let poolCount = 0;

    for (const house of street.houses) {
      if (house.hasPool) {
        poolCount++;
      }
    }

    if (poolCount > 0) {
      totalScore += getPoolValue(poolCount);
    }
  }

  return totalScore;
}

export function calculateParkScore(player: Player): number {
  let totalScore = 0;

  for (const streetType of ['A', 'B', 'C'] as StreetType[]) {
    const street = player.streets[streetType];
    let parkCount = 0;

    for (const house of street.houses) {
      if (house.hasPark) {
        parkCount++;
      }
    }

    if (parkCount > 0) {
      totalScore += getParkValue(streetType, parkCount);
    }
  }

  return totalScore;
}

export function calculateBISPenalty(player: Player): number {
  return getBISPenalty(player.bisCount);
}

export function calculatePermitPenalty(player: Player): number {
  return getPermitPenalty(player.buildingPermitRefusals);
}

export function calculateCityPlanScore(player: Player, mode: GameMode): number {
  let score = 0;

  for (const plan of player.cityPlans) {
    if (player.completedPlans.includes(plan.id)) {
      const scores = mode === 'classic' ? plan.classic : plan.balanced;
      score += scores.first;
    }
  }

  return score;
}

// Helper functions for scoring values

export function getEstateValue(size: number): number {
  switch (size) {
    case 1: return 1;
    case 2: return 3;
    case 3: return 6;
    case 4: return 10;
    case 5: return 15;
    case 6: return 21;
    default: return 0;
  }
}

export function getPoolValue(count: number): number {
  switch (count) {
    case 1: return 3;
    case 2: return 6;
    case 3: return 9;
    case 4: return 13;
    case 5: return 17;
    case 6: return 21;
    case 7: return 26;
    case 8: return 31;
    case 9: return 36;
    default: return 0;
  }
}

export function getParkValue(street: StreetType, count: number): number {
  const baseValues = {
    'A': [2, 4, 10], // Street A: 3 park slots
    'B': [2, 4, 6, 14], // Street B: 4 park slots
    'C': [2, 4, 6, 8, 18] // Street C: 5 park slots
  };

  const values = baseValues[street];
  let score = 0;

  for (let i = 0; i < Math.min(count, values.length); i++) {
    score += values[i];
  }

  return score;
}

export function getBISPenalty(count: number): number {
  switch (count) {
    case 1: return -1;
    case 2: return -3;
    case 3: return -6;
    case 4: return -9;
    case 5: return -12;
    case 6: return -16;
    case 7: return -20;
    case 8: return -24;
    case 9: return -28;
    default: return count > 9 ? -28 - (count - 9) * 4 : 0;
  }
}

export function getPermitPenalty(count: number): number {
  switch (count) {
    case 1: return 0;
    case 2: return -3;
    case 3: return -5;
    default: return count > 3 ? -5 - (count - 3) * 3 : 0;
  }
}

// Estate detection

export function findEstates(player: Player, street: StreetType): { startIndex: number; endIndex: number; size: number }[] {
  const houses = player.streets[street].houses;
  const estates = [];

  let currentEstateStart = -1;

  for (let i = 0; i < houses.length; i++) {
    if (houses[i].number !== null) {
      if (currentEstateStart === -1) {
        currentEstateStart = i;
      }
    } else {
      if (currentEstateStart !== -1) {
        estates.push({
          startIndex: currentEstateStart,
          endIndex: i - 1,
          size: i - currentEstateStart
        });
        currentEstateStart = -1;
      }
    }
  }

  // Handle estate at the end
  if (currentEstateStart !== -1) {
    estates.push({
      startIndex: currentEstateStart,
      endIndex: houses.length - 1,
      size: houses.length - currentEstateStart
    });
  }

  // Also consider fences as estate boundaries
  const fencedEstates = [];
  for (const estate of estates) {
    let subEstateStart = estate.startIndex;

    for (let i = estate.startIndex; i <= estate.endIndex; i++) {
      if (houses[i].hasFence && i < estate.endIndex) {
        fencedEstates.push({
          startIndex: subEstateStart,
          endIndex: i,
          size: i - subEstateStart + 1
        });
        subEstateStart = i + 1;
      }
    }

    // Add the last sub-estate
    if (subEstateStart <= estate.endIndex) {
      fencedEstates.push({
        startIndex: subEstateStart,
        endIndex: estate.endIndex,
        size: estate.endIndex - subEstateStart + 1
      });
    }
  }

  return fencedEstates.length > 0 ? fencedEstates : estates;
}

// City plan checking functions

export function checkCityPlanCompletion(player: Player, plan: CityPlan): boolean {
  switch (plan.type) {
    case 'estate':
      return checkEstatePlan(player, plan);
    case 'street':
      return checkStreetPlan(player, plan);
    case 'pool':
      return checkPoolPlan(player, plan);
    case 'park':
      return checkParkPlan(player, plan);
    case 'effect':
      return checkEffectPlan(player, plan);
    default:
      return false;
  }
}

function checkEstatePlan(player: Player, plan: CityPlan): boolean {
  const objective = plan.objective;
  const estateCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  for (const streetType of ['A', 'B', 'C'] as StreetType[]) {
    const estates = findEstates(player, streetType);
    for (const estate of estates) {
      if (estate.size >= 1 && estate.size <= 6) {
        estateCounts[estate.size]++;
      }
    }
  }

  // Parse objectives like "6 estates of size 1", "4 estates of size 2", etc.
  const matches = objective.match(/(\d+) estates? of size (\d+)/);
  if (matches) {
    const count = parseInt(matches[1]);
    const size = parseInt(matches[2]);
    return estateCounts[size] >= count;
  }

  // Handle mixed objectives like "1 estate size 3 and 1 estate size 6"
  const mixedMatches = objective.match(/(\d+) estate size (\d+) and (\d+) estate size (\d+)/);
  if (mixedMatches) {
    const count1 = parseInt(mixedMatches[1]);
    const size1 = parseInt(mixedMatches[2]);
    const count2 = parseInt(mixedMatches[3]);
    const size2 = parseInt(mixedMatches[4]);
    return estateCounts[size1] >= count1 && estateCounts[size2] >= count2;
  }

  return false;
}

function checkStreetPlan(player: Player, plan: CityPlan): boolean {
  const objective = plan.objective;

  if (objective.includes('All 12 houses built in street 3')) {
    return player.streets.C.houses.every(h => h.number !== null);
  }

  if (objective.includes('All 10 houses built in street 1')) {
    return player.streets.A.houses.every(h => h.number !== null);
  }

  if (objective.includes('First and last house in every street are built')) {
    return ['A', 'B', 'C'].every(streetType => {
      const street = player.streets[streetType as StreetType];
      return street.houses[0].number !== null &&
             street.houses[street.houses.length - 1].number !== null;
    });
  }

  if (objective.includes('All pools and parks built in street 3')) {
    const street = player.streets.C;
    return street.houses.every(h => h.number !== null && (h.hasPool || h.hasPark));
  }

  if (objective.includes('All pools and parks built in street 2')) {
    const street = player.streets.B;
    return street.houses.every(h => h.number !== null && (h.hasPool || h.hasPark));
  }

  return false;
}

function checkPoolPlan(player: Player, plan: CityPlan): boolean {
  const objective = plan.objective;

  if (objective.includes('Two streets each have 3 completed pools')) {
    let streetsWith3Pools = 0;
    for (const streetType of ['A', 'B', 'C'] as StreetType[]) {
      const poolCount = player.streets[streetType].houses.filter(h => h.hasPool).length;
      if (poolCount >= 3) streetsWith3Pools++;
    }
    return streetsWith3Pools >= 2;
  }

  return false;
}

function checkParkPlan(player: Player, plan: CityPlan): boolean {
  const objective = plan.objective;

  if (objective.includes('All parks or all pools completed in two different streets')) {
    let streetsWithAllParksOrPools = 0;
    for (const streetType of ['A', 'B', 'C'] as StreetType[]) {
      const street = player.streets[streetType];
      const builtHouses = street.houses.filter(h => h.number !== null);
      if (builtHouses.length === 0) continue;

      const allParks = builtHouses.every(h => h.hasPark);
      const allPools = builtHouses.every(h => h.hasPool);

      if (allParks || allPools) streetsWithAllParksOrPools++;
    }
    return streetsWithAllParksOrPools >= 2;
  }

  return false;
}

function checkEffectPlan(player: Player, plan: CityPlan): boolean {
  const objective = plan.objective;

  if (objective.includes('Use 7 Temp Agencies')) {
    return player.tempAgencyUses >= 7;
  }

  if (objective.includes('Use 5 BIS effects')) {
    return player.bisCount >= 5;
  }

  return false;
}
