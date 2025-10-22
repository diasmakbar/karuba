// src/pages/LobbyColorStep.tsx

import { PLAYER_COLORS } from '../game/types';

interface LobbyColorStepProps {
  gameId: string;
  name: string;
  color: string;
  setColor: (color: string) => void;
  onJoin: () => void;
}

export default function LobbyColorStep({ gameId, name, color, setColor, onJoin }: LobbyColorStepProps) {
  return (
    <div>
      <h3>Choose Your Color</h3>
      <p>Game: {gameId}</p>
      <p>Name: {name}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
        {PLAYER_COLORS.map((col, index) => (
          <button
            key={index}
            onClick={() => setColor(col.color)}
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: col.color,
              color: col.textColor,
              border: color === col.color ? '3px solid #000' : '2px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
            title={`Color ${index + 1}`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <button onClick={onJoin} disabled={!color} style={{ width: '100%', padding: '10px', backgroundColor: color || '#ccc' }}>
        Join Game
      </button>
    </div>
  );
}
