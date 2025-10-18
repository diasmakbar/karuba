// src/App.tsx

import { useState } from 'react';
import GameBoard from './components/GameBoard';
import LandSelectionTest from './components/LandSelectionTest';
import { getMaxTileCount } from './game/config';
import type { Attraction } from './game/types';

export default function App() {
  const [playerCount] = useState(5);
  const maxTile = getMaxTileCount(playerCount);
  const [submittedTiles, setSubmittedTiles] = useState<number[]>([]);
  const [submittedAttractions, setSubmittedAttractions] = useState<Attraction[]>([]);

  const handleSelected = (tiles: number[], attractions: Attraction[]) => {
    setSubmittedTiles(tiles);
    setSubmittedAttractions(attractions);
  };

  return (
    <div>
      <h1 style={{ textAlign: 'center', color: 'white', margin: '10px' }}>
        Rancang — Testing Distribusi
      </h1>

      <LandSelectionTest
        maxTile={72}
        onSelected={handleSelected}
      />

      {/* Opsional: tampilkan atraksi di sini juga */}
      {submittedAttractions.length > 0 && (
        <div style={{ padding: '10px', background: '#333', color: 'white', margin: '0 20px' }}>
          <strong>Atraksi kamu:</strong>
          {submittedAttractions.map((attr, i) => (
            <span key={i} style={{ marginLeft: '8px' }}>
              [Tipe {attr.size}: {attr.type}]
            </span>
          ))}
        </div>
      )}

      <GameBoard
        n={maxTile}
        ownedTiles={submittedTiles}
        submittedTiles={submittedTiles}
      />
    </div>
  );
}