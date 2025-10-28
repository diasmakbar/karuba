import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Board from '../components/Board';
import { emptyPlayerBoard } from '../utils/lobby';
import { getRandomCityPlans } from '../lib/cityPlans';
import type { PlayerBoard, CityPlan, GameStatus } from '../lib/types';
import { useLang } from '../contexts/LangContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Room() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLang();
  const { theme } = useTheme();
  const [board] = useState<PlayerBoard>(emptyPlayerBoard());
  const [gameStatus, setGameStatus] = useState<GameStatus>('waiting');
  const [cityPlans, setCityPlans] = useState<CityPlan[]>([]);
  const [currentCard, setCurrentCard] = useState<string | null>(null);
  const [isHost] = useState(false); // Placeholder
  const [gameMode, setGameMode] = useState<'classic' | 'balanced'>('balanced');

  // Load game data from Firebase
  useEffect(() => {
    const loadGameData = async () => {
      if (!id) return;

      try {
        const { get, ref, db } = await import('../firebase');
        const gameRef = ref(db, `games/rancang/${id}`);
        const snapshot = await get(gameRef);

        if (snapshot.exists()) {
          const gameData = snapshot.val();
          setGameStatus(gameData.status || 'waiting');
          setGameMode(gameData.mode || 'balanced');
          setCityPlans(gameData.cityPlans || []);
          setCurrentCard(gameData.currentCard?.number ? `Card ${gameData.currentCard.number}` : null);
        }
      } catch (error) {
        console.error('Error loading game data:', error);
      }
    };

    loadGameData();
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
        backgroundColor: theme === 'dark' ? '#333' : '#f8f9fa',
        border: theme === 'dark' ? '1px solid #555' : '1px solid #dee2e6',
        borderRadius: 8,
        color: theme === 'dark' ? '#fff' : '#000'
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
                border: theme === 'dark' ? '2px solid #ffffff' : '2px solid #dee2e6',
                borderRadius: 8,
                backgroundColor: theme === 'dark' ? 'transparent' : '#ffffff',
                color: theme === 'dark' ? '#ffffff' : '#000000',
                minWidth: 250,
                textAlign: 'center',
                boxShadow: theme === 'dark' ? '0 4px 12px rgba(255,255,255,0.1)' : '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              <h3 style={{ margin: '0 0 10px 0', fontSize: 16 }}>
                Plan {index + 1}
              </h3>
              <p style={{ margin: 0, fontSize: 14 }}>
                {t(`cityPlans.${plan.id}`)}
              </p>
              <div style={{
                marginTop: 10,
                fontSize: 12,
                color: theme === 'dark' ? '#cccccc' : '#6c757d'
              }}>
                {gameMode === 'classic'
                  ? `Classic: ${plan.classic.first}/${plan.classic.later} pts`
                  : `Balanced: ${plan.balanced.first}/${plan.balanced.later} pts`
                }
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
