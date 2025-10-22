import type { Attraction } from '../game/types';

// Helper function to get attraction initials
function getAttractionInitial(type: string): string {
  return type.split('-').map(word => word[0].toUpperCase()).join('');
}

interface PlayerHandProps {
  attractions: Attraction[];
  playerColor: string;
}

export default function PlayerHand({ attractions, playerColor }: PlayerHandProps) {
  return (
    <div style={{ background: '#2d2d2d', padding: '16px', borderRadius: '8px', width: '300px' }}>
      <h4 style={{ color: '#fff', marginBottom: '12px' }}>Your Attractions</h4>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {attractions.map((attr, index) => (
          <div
            key={index}
            style={{
              width: '50px',
              height: '50px',
              background: playerColor,
              opacity: 0.9,
              color: '#fff',
              borderRadius: '6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
            title={`${attr.type} (${attr.size})`}
          >
            <div>{getAttractionInitial(attr.type)}</div>
            <div>({attr.size})</div>
          </div>
        ))}
      </div>
      {attractions.length === 0 && (
        <div style={{ color: '#888', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
          No attractions left
        </div>
      )}
    </div>
  );
}
