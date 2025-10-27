// src/pages/Demo.tsx

import { useState } from 'react';
import PlayerBoard from '../components/PlayerBoard';
import type { Player, StreetType, ConstructionCard } from '../game/types';
import { createDeck, dealHands } from '../game/deck';
import { playNumberCard, playEffectCard } from '../game/actions';
import { calculateScore } from '../game/scoring';

export default function Demo() {
  // Create a sample player
  const [player, setPlayer] = useState<Player>(() => {
    const deck = createDeck();
    const { hands } = dealHands(deck, 1);

    return {
      id: 'demo-player',
      name: 'Demo Player',
      color: '#4caf50',
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
      hand: hands[0].slice(0, 6), // Show first 6 cards
      cityPlans: [],
      completedPlans: [],
      tempAgencyUses: 0,
      bisCount: 0,
      buildingPermitRefusals: 0,
      score: 0
    };
  });

  const [selectedCard, setSelectedCard] = useState<ConstructionCard | null>(null);

  const handleHouseClick = (street: StreetType, houseIndex: number) => {
    if (!selectedCard || selectedCard.type !== 'number') return;

    try {
      const newPlayer = playNumberCard(player, selectedCard, street, houseIndex);
      setPlayer({ ...newPlayer, score: calculateScore(newPlayer, 'balanced') });
      setSelectedCard(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Invalid move');
    }
  };

  const handlePoolClick = (street: StreetType, houseIndex: number) => {
    if (!selectedCard || selectedCard.effect !== 'pool') return;

    try {
      const { player: newPlayer } = playEffectCard(player, selectedCard, { id: '', players: {}, currentPlayer: '', deck: [], discardPile: [], round: 1, status: 'playing', mode: 'balanced', availablePlans: [], startTime: Date.now() }, { street, houseIndex });
      setPlayer({ ...newPlayer, score: calculateScore(newPlayer, 'balanced') });
      setSelectedCard(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Invalid move');
    }
  };

  const handleParkClick = (street: StreetType, houseIndex: number) => {
    if (!selectedCard || selectedCard.effect !== 'landscaper') return;

    try {
      const { player: newPlayer } = playEffectCard(player, selectedCard, { id: '', players: {}, currentPlayer: '', deck: [], discardPile: [], round: 1, status: 'playing', mode: 'balanced', availablePlans: [], startTime: Date.now() }, { street, houseIndex });
      setPlayer({ ...newPlayer, score: calculateScore(newPlayer, 'balanced') });
      setSelectedCard(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Invalid move');
    }
  };

  const handleFenceClick = (street: StreetType, houseIndex: number) => {
    if (!selectedCard || selectedCard.effect !== 'surveyor') return;

    // For demo, just place fence between houseIndex and houseIndex+1
    try {
      const { player: newPlayer } = playEffectCard(player, selectedCard, { id: '', players: {}, currentPlayer: '', deck: [], discardPile: [], round: 1, status: 'playing', mode: 'balanced', availablePlans: [], startTime: Date.now() }, { startIndex: houseIndex, endIndex: houseIndex + 1, street });
      setPlayer({ ...newPlayer, score: calculateScore(newPlayer, 'balanced') });
      setSelectedCard(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Invalid move');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Welcome To: Your Perfect Home - Demo</h1>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* Player Board */}
        <div style={{ flex: 1 }}>
          <PlayerBoard
            streets={player.streets}
            onHouseClick={handleHouseClick}
            onPoolClick={handlePoolClick}
            onParkClick={handleParkClick}
            onFenceClick={handleFenceClick}
          />
        </div>

        {/* Game Info */}
        <div style={{ width: '300px' }}>
          <div style={{ marginBottom: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '8px' }}>
            <h3>Score: {player.score}</h3>
            <p>BIS Count: {player.bisCount}</p>
            <p>Temp Agencies: {player.tempAgencyUses}</p>
            <p>Permit Refusals: {player.buildingPermitRefusals}</p>
          </div>

          {/* Hand */}
          <div style={{ marginBottom: '20px' }}>
            <h3>Your Hand:</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {player.hand.map((card, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedCard(card)}
                  style={{
                    width: '80px',
                    height: '60px',
                    border: selectedCard === card ? '3px solid #007bff' : '2px solid #333',
                    borderRadius: '4px',
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textAlign: 'center'
                  }}
                >
                  {card.type === 'number' ? (
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{card.number}</div>
                      <div>House</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 'bold' }}>
                        {card.effect?.replace('-', ' ').toUpperCase()}
                      </div>
                      <div>Effect</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div style={{ padding: '15px', background: '#e8f4f8', borderRadius: '8px', fontSize: '14px' }}>
            <h4>How to Play:</h4>
            <ul>
              <li>Click a card to select it</li>
              <li>Click empty house slots to place numbers</li>
              <li>Click blue circles to build pools</li>
              <li>Click green triangles to build parks</li>
              <li>Click bottom borders to place fences</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
