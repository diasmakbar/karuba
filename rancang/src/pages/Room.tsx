import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Board from '../components/Board';
import { emptyPlayerBoard } from '../utils/lobby';
import { getRandomCityPlans } from '../lib/cityPlans';
import type { PlayerBoard, CityPlan, GameStatus } from '../lib/types';
import { useLang } from '../contexts/LangContext';

export default function Room() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLang();
  const [board] = useState<PlayerBoard>(emptyPlayerBoard());
  const [gameStatus, setGameStatus] = useState<GameStatus>('waiting');
  const [cityPlans, setCityPlans] = useState<CityPlan[]>([]);
  const [currentCard, setCurrentCard] = useState<string | null>(null);
  const [isHost] = useState(false); // Placeholder

  // Placeholder: in real implementation, sync with Firebase
  useEffect(() => {
    console.log('Room ID:', id);
    // Generate city plans for demo
    const plans = getRandomCityPlans(true);
    setCityPlans(plans);
  }, [id]);

  const handleSlotClick = (street: 1 | 2 | 3, index: number) => {
    // Placeholder action
    console.log('Clicked slot:', street, index);
  };

  const handleStartGame = () => {
    setGameStatus('playing');
    setCurrentCard('Sample Card'); // Placeholder
  };

  const handleDrawCard = () => {
    setCurrentCard('New Card Drawn'); // Placeholder
  };

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 20 }}>
        {t('ui.roomTitle')} - Room {id}
      </h1>

      {/* Game Status */}
      <div style={{
        textAlign: 'center',
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 8
      }}>
        <strong>Status: {t(`ui.${gameStatus}`)}</strong>
        {currentCard && (
          <div style={{ marginTop: 10 }}>
            <strong>Current Card:</strong> {currentCard}
          </div>
        )}
      </div>

      {/* Host Controls */}
      {isHost && gameStatus === 'waiting' && (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <button
            onClick={handleStartGame}
            style={{
              padding: '12px 24px',
              fontSize: 18,
              backgroundColor: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            Start Game
          </button>
        </div>
      )}

      {/* Game Controls */}
      {gameStatus === 'playing' && (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <button
            onClick={handleDrawCard}
            style={{
              padding: '10px 20px',
              fontSize: 16,
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              marginRight: 10
            }}
          >
            Draw Card
          </button>
          <button
            style={{
              padding: '10px 20px',
              fontSize: 16,
              backgroundColor: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            {t('ui.placeHouse')}
          </button>
        </div>
      )}

      {/* City Plans */}
      <div style={{ marginBottom: 30 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 15 }}>City Plans</h2>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 15,
          justifyContent: 'center'
        }}>
          {cityPlans.map((plan, index) => (
            <div
              key={plan.id}
              style={{
                padding: 15,
                border: '2px solid #dee2e6',
                borderRadius: 8,
                backgroundColor: '#fff',
                minWidth: 250,
                textAlign: 'center'
              }}
            >
              <h3 style={{ margin: '0 0 10px 0', fontSize: 16 }}>
                Plan {index + 1}
              </h3>
              <p style={{ margin: 0, fontSize: 14 }}>
                {t(`cityPlans.${plan.id}`)}
              </p>
              <div style={{ marginTop: 10, fontSize: 12, color: '#6c757d' }}>
                Classic: {plan.classic.first}/{plan.classic.later} | Balanced: {plan.balanced.first}/{plan.balanced.later} pts
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Player Board */}
      <div style={{ marginTop: 30 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Your Board</h2>
        <Board board={board} onSlotClick={handleSlotClick} />
      </div>
    </div>
  );
}
