// src/components/GameBoard.tsx

import { generateSpiralGrid } from '../game/spiral';
import type { Attraction } from '../game/types';
import React from 'react';

// Helper function to get attraction initials
function getAttractionInitial(type: string): string {
  return type.split('-').map(word => word[0].toUpperCase()).join('');
}

interface GameBoardProps {
  n?: number;
  ownedTiles?: Record<number, string>; // tile -> owner uid
  playerColors?: Record<string, string>; // uid -> color
  builtAttractions?: Record<number, Attraction>; // tile -> attraction
  onTileClick?: (tile: number) => void;
  selectedTilesForBlink?: number[]; // tiles to blink white
}

export default function GameBoard({ n = 36, ownedTiles = {}, playerColors = {}, builtAttractions = {}, onTileClick, selectedTilesForBlink }: GameBoardProps) {
  const cells = generateSpiralGrid(n);

  const minX = Math.min(...cells.map(c => c.x));
  const maxX = Math.max(...cells.map(c => c.x));
  const minY = Math.min(...cells.map(c => c.y));
  const maxY = Math.max(...cells.map(c => c.y));

  const gridSizeX = maxX - minX + 1.5;
  const gridSizeY = maxY - minY + 1;
  const tileSize = 50;

  const boardWidth = gridSizeX * tileSize;
  const boardHeight = gridSizeY * tileSize;

  return (
    <>
      <style>
        {`
          @keyframes blink-white {
            0% { background: inherit; opacity: inherit; }
            50% { background: white; opacity: 1; }
            100% { background: inherit; opacity: inherit; }
          }
        `}
      </style>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          background: '#1e1e1e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: '20px',
        }}
      >
      <div
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '100vw',
          maxHeight: '100vh',
          overflow: 'auto',
          border: '1px solid #444',
          borderRadius: '8px',
          background: '#2d2d2d',
          boxShadow: '0 0 20px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: `${boardWidth}px`,
            height: `${boardHeight}px`,
            padding: '20px',
          }}
        >
          {cells.map((cell) => {
            const ownerId = ownedTiles[cell.n];
            const ownerColor = ownerId ? playerColors[ownerId] || '#333' : '#333';
            const builtAttr = builtAttractions[cell.n];
            const isOwned = !!ownerId;
            const isBuilt = !!builtAttr;

            // Base content: tile number or attraction layout
            let content: React.ReactNode = cell.n;
            if (isBuilt) {
              // Attraction display layout
              const initial = getAttractionInitial(builtAttr.type);
              content = (
                <div style={{ textAlign: 'center', lineHeight: '1.1' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{initial}</div>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', position: 'relative', top: '-2px' }}>({builtAttr.size})</div>
                  <div style={{ fontSize: '10px', marginTop: '-2px' }}>{cell.n}</div>
                </div>
              );
            }

            return (
              <div
                key={cell.n}
                onClick={() => onTileClick?.(cell.n)}
                style={{
                  position: 'absolute',
                  left: `${(cell.x - minX) * tileSize}px`,
                  top: `${(cell.y - minY) * tileSize}px`,
                  width: `${tileSize}px`,
                  height: `${tileSize}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#fff',
                  background: '#333',
                  opacity: isOwned ? 1 : 0.2, // semi-transparent if claimed, but owned full opacity
                  border: selectedTilesForBlink?.includes(cell.n) ? '2px solid #fff' : isOwned ? `2px solid ${ownerColor}` : '1px solid #666',
                  borderRadius: '4px',
                  userSelect: 'none',
                  cursor: onTileClick ? 'pointer' : 'default',
                  animation: selectedTilesForBlink?.includes(cell.n) ? 'blink-white 1s ease-out infinite' : 'none',
                }}
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </>
  );
}
