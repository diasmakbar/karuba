// src/components/BuildModal.tsx

import type { Attraction } from '../game/types';

// Helper function to get attraction initials
function getAttractionInitial(type: string): string {
  return type.split('-').map(word => word[0].toUpperCase()).join('');
}

interface BuildModalProps {
  attractions: Attraction[];
  onSelect: (attraction: Attraction) => void;
  onCancel: () => void;
  playerColor: string;
}

export default function BuildModal({ attractions, onSelect, onCancel, playerColor }: BuildModalProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '400px',
        width: '90%'
      }}>
        <h3>Choose Attraction to Build</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {attractions.map((attr, index) => (
            <button
              key={index}
              onClick={() => onSelect(attr)}
              style={{
                width: '50px',
                height: '50px',
                background: playerColor,
                opacity: 0.8,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <div>{getAttractionInitial(attr.type)}</div>
              <div>({attr.size})</div>
            </button>
          ))}
        </div>
        <button onClick={onCancel} style={{ padding: '8px 16px', background: '#ccc', border: 'none', borderRadius: '4px' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
