// src/components/LandSelectionTest.tsx

import { useState, useMemo } from 'react';
import type { Attraction } from '../game/types';
import { generateAllAttractions } from '../game/config';

interface LandSelectionTestProps {
  maxTile: number;
  onSelected: (tiles: number[], attractions: Attraction[]) => void;
}

export default function LandSelectionTest({ maxTile, onSelected }: LandSelectionTestProps) {
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // --- Generate 5 tile acak ---
  const randomTiles = useMemo(() => {
    const set = new Set<number>();
    while (set.size < 5) {
      set.add(Math.floor(Math.random() * maxTile) + 1);
    }
    return Array.from(set);
  }, [maxTile]);

  // --- Generate 1 atraksi per tipe (3, 4, 5) ---
  const randomAttractions = useMemo<Attraction[]>(() => {
    // Ambil semua atraksi (1 set cukup)
    const all = generateAllAttractions(2); // 2 pemain → 1 set

    const type3 = all.filter(a => a.size === 3);
    const type4 = all.filter(a => a.size === 4);
    const type5 = all.filter(a => a.size === 5);

    const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    return [
      pickRandom(type3),
      pickRandom(type4),
      pickRandom(type5)
    ];
  }, []);

  const toggleTile = (tile: number) => {
    if (submitted) return;
    if (selectedTiles.includes(tile)) {
      setSelectedTiles(prev => prev.filter(t => t !== tile));
    } else if (selectedTiles.length < 3) {
      setSelectedTiles(prev => [...prev, tile]);
    }
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
      <h3 style={{ marginBottom: '16px' }}>Pilih Tanah (Maks 3)</h3>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {randomTiles.map(tile => {
          const isSelected = selectedTiles.includes(tile);
          const isDisabled = !isSelected && selectedTiles.length >= 3 && !submitted;

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
                background: isSelected ? '#4caf50' : '#555',
                color: 'white',
                border: isSelected ? '2px solid #8bc34a' : '1px solid #777',
                borderRadius: '6px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1,
              }}
            >
              {isSelected ? '✓' : tile}
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