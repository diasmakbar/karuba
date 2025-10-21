// src/components/Scoreboard.tsx

import React from 'react';
import type { Player } from '../game/types';

// Helper function to get attraction initials
function getAttractionInitial(type: string): string {
  return type.split('-').map(word => word[0].toUpperCase()).join('');
}

interface ScoreboardProps {
  players: Player[];
  currentPlayerId?: string;
}

export default function Scoreboard({ players, currentPlayerId }: ScoreboardProps) {
  return (
    <div style={{ background: '#2d2d2d', padding: '16px', borderRadius: '8px' }}>
      <h3 style={{ color: '#fff', marginBottom: '16px' }}>Players</h3>
      {players.map(player => (
        <div key={player.id} style={{ marginBottom: '16px', padding: '8px', border: player.id === currentPlayerId ? '2px solid #4caf50' : '1px solid #444', borderRadius: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>{player.name}</span>
            <span style={{ color: '#ffd700' }}>💰 {player.coins}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {player.attractions.map((attr, index) => (
              <div
                key={`${player.id}-attr-${index}`}
                style={{
                  width: '40px',
                  height: '40px',
                  background: player.color,
                  opacity: 0.8,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                title={`${attr.type} (${attr.size})`}
              >
                {getAttractionInitial(attr.type)} ({attr.size})
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
