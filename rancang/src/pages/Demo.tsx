// src/pages/Demo.tsx

import { useState } from 'react';
import LandSelectionTest from '../components/LandSelectionTest';
import GameBoard from '../components/GameBoard';

export default function Demo() {
  const [blinkingTiles, setBlinkingTiles] = useState<number[]>([]);

  const handleUpdateBlinkingTiles = (tiles: number[]) => {
    setBlinkingTiles(tiles);
    // Animations stop when tiles are removed
  };

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
      <div style={{ width: '400px' }}>
        <LandSelectionTest
          maxTile={49}
          playerCount={5}
          round={1}
          playerColor="#4caf50"
          onSelected={(tiles, attractions) => console.log(tiles, attractions)}
          onUpdateBlinkingTiles={handleUpdateBlinkingTiles}
        />
      </div>
      <div style={{ flex: 1 }}>
        <GameBoard
          n={49}
          selectedTilesForBlink={blinkingTiles}
        />
      </div>
    </div>
  );
}
