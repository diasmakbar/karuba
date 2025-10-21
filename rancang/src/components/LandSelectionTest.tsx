// src/components/LandSelectionTest.tsx

import { useState, useMemo } from 'react';
import type { Attraction } from '../game/types';
import { generateAllAttractions, getRoundRules } from '../game/config';

interface LandSelectionTestProps {
  maxTile: number;
  playerCount: number;
  round: number; // 1-4
  playerColor: string; // color for selected buttons
  tilePool?: number[]; // if provided, use this as options instead of random
  onSelected: (tiles: number[], attractions: Attraction[]) => void;
  onUpdateBlinkingTiles?: (tiles: number[]) => void; // for blinking effect, pass current selected tiles
}

export default function LandSelectionTest({ maxTile, playerCount, round, playerColor, tilePool, onSelected, onUpdateBlinkingTiles }: LandSelectionTestProps) {
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const roundRules = useMemo(() => getRoundRules(playerCount)[round - 1], [playerCount, round]);
  const landCount = roundRules.land; // the number to choose

  // --- Generate or use provided tile pool ---
  const randomTiles = useMemo(() => {
    if (tilePool) {
      // Use provided pool, take first 7 for example (landCount + 2 = 7 for 2-3 players)
      return tilePool.slice(0, landCount + 2);
    }
    const set = new Set<number>();
    while (set.size < landCount + 2) {
      set.add(Math.floor(Math.random() * maxTile) + 1);
    }
    return Array.from(set);
  }, [maxTile, landCount, tilePool]);

  // --- Generate 3 random attractions from full pool ---
  const randomAttractions = useMemo<Attraction[]>(() => {
    const all = generateAllAttractions(playerCount);
    // Shuffle and pick first 3
    const shuffled = [...all].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }, [playerCount]);

  const toggleTile = (tile: number) => {
    if (submitted) return;
    setSelectedTiles(prev => {
      const newSelected = [...prev];
      const index = newSelected.indexOf(tile);
      if (index > -1) {
        newSelected.splice(index, 1); // remove
      } else if (newSelected.length < landCount) {
        newSelected.push(tile); // add
      }
      onUpdateBlinkingTiles?.(newSelected);
      return newSelected;
    });
  };

  const handleSubmit = () => {
    if (selectedTiles.length === 0) return;
    setSubmitted(true);
    onSelected(selectedTiles, randomAttractions);
  };

  // Helper: nama tipe atraksi (opsional, biar rapi)
  const getAttractionLabel = (type: string) => {
    const labels: Record<string, string> = {
      'rest-area': 'Rest Area',
      'minimarket': 'Minimarket',
      'tempat-ibadah': 'Tempat Ibadah',
      'taman': 'Taman',
      'bioskop': 'Bioskop',
      'lapangan-olahraga': 'Lapangan Olahraga',
      'gedung-bisnis': 'Gedung Bisnis',
      'waterboom': 'Waterboom',
      'apartemen': 'Apartemen',
    };
    return labels[type] || type;
  };

  return (
    <div style={{ padding: '20px', background: '#333', borderRadius: '8px', margin: '20px', color: 'white' }}>
      <h3 style={{ marginBottom: '16px' }}>Pilih Tanah (Select {landCount} from {landCount + 2} options)</h3>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {randomTiles.map(tile => {
          const isSelected = selectedTiles.includes(tile);
          const isDisabled = !isSelected && selectedTiles.length >= landCount && !submitted;

          return (
            <button
              key={tile}
              onClick={() => toggleTile(tile)}
              disabled={isDisabled || submitted}
              style={{
                width: '50px',
                height: '50px',
                fontSize: '16px',
                fontWeight: 'bold',
                background: isSelected ? playerColor : '#555', // player color for selected
                color: 'white',
                border: isSelected ? '2px solid #8bc34a' : '1px solid #777',
                borderRadius: '6px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1,
              }}
            >
              {tile}
            </button>
          );
        })}
      </div>

      {/* Tampilkan atraksi */}
      <div style={{ marginBottom: '16px' }}>
        <h4>Atraksi yang Didapat:</h4>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
          {randomAttractions.map((attr, i) => (
            <li key={i}>
              tipe {attr.size} - {getAttractionLabel(attr.type)}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleSubmit}
        disabled={selectedTiles.length === 0 || submitted}
        style={{
          padding: '8px 16px',
          background: submitted ? '#666' : '#2196f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: submitted ? 'default' : 'pointer',
        }}
      >
        {submitted ? 'Submitted!' : 'Submit'}
      </button>

      {submitted && (
        <p style={{ color: '#8bc34a', marginTop: '8px' }}>
          Tile: {selectedTiles.join(', ')}
        </p>
      )}
    </div>
  );
}
