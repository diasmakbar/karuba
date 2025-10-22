import { useState } from 'react';
import type { Player, Attraction } from '../game/types';

// Helper function to get attraction initials
function getAttractionInitial(type: string): string {
  return type.split('-').map(word => word[0].toUpperCase()).join('');
}

interface TradeOffer {
  from: string;
  to: string;
  giveTiles: number[];
  getAttractions: Attraction[];
  status: 'pending' | 'accepted' | 'rejected';
}

interface NegotiationPanelProps {
  players: Player[];
  currentPlayerId: string;
  onSendOffer: (offer: Omit<TradeOffer, 'status'>) => void;
  offers: TradeOffer[];
  onAcceptOffer: (offerId: string) => void;
  onRejectOffer: (offerId: string) => void;
}

export default function NegotiationPanel({
  players,
  currentPlayerId,
  onSendOffer,
  offers,
  onAcceptOffer,
  onRejectOffer
}: NegotiationPanelProps) {
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [giveTiles, setGiveTiles] = useState<number[]>([]);
  const [getAttractions, setGetAttractions] = useState<Attraction[]>([]);

  const me = players.find(p => p.id === currentPlayerId);
  const otherPlayers = players.filter(p => p.id !== currentPlayerId);

  const handleSendOffer = () => {
    if (!selectedPlayer || giveTiles.length === 0 || getAttractions.length === 0) return;
    onSendOffer({
      from: currentPlayerId,
      to: selectedPlayer,
      giveTiles,
      getAttractions,
    });
    setSelectedPlayer('');
    setGiveTiles([]);
    setGetAttractions([]);
  };

  const toggleGiveTile = (tile: number) => {
    setGiveTiles(prev =>
      prev.includes(tile) ? prev.filter(t => t !== tile) : [...prev, tile]
    );
  };

  const toggleGetAttraction = (attr: Attraction) => {
    setGetAttractions(prev =>
      prev.some(a => a.type === attr.type && a.size === attr.size)
        ? prev.filter(a => !(a.type === attr.type && a.size === attr.size))
        : [...prev, attr]
    );
  };

  return (
    <div style={{ background: '#2d2d2d', padding: '16px', borderRadius: '8px', width: '400px' }}>
      <h3 style={{ color: '#fff', marginBottom: '16px' }}>Negotiation</h3>

      {/* Send Offer */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ color: '#fff' }}>Send Trade Offer</h4>

        <select
          value={selectedPlayer}
          onChange={(e) => setSelectedPlayer(e.target.value)}
          style={{ width: '100%', padding: '4px', marginBottom: '8px' }}
        >
          <option value="">Select Player</option>
          {otherPlayers.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {selectedPlayer && (
          <>
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#fff' }}>Give Tiles:</strong>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                {me?.tiles?.map(tile => (
                  <button
                    key={tile}
                    onClick={() => toggleGiveTile(tile)}
                    style={{
                      width: '30px',
                      height: '30px',
                      background: giveTiles.includes(tile) ? '#4caf50' : '#555',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  >
                    {tile}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#fff' }}>Get Attractions:</strong>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                {players.find(p => p.id === selectedPlayer)?.attractions?.map((attr, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleGetAttraction(attr)}
                    style={{
                      width: '30px',
                      height: '30px',
                      background: getAttractions.some(a => a.type === attr.type && a.size === attr.size) ? '#4caf50' : '#555',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div>{getAttractionInitial(attr.type)}</div>
                    <div>({attr.size})</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSendOffer}
              disabled={giveTiles.length === 0 || getAttractions.length === 0}
              style={{
                padding: '6px 12px',
                background: '#2196f3',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Send Offer
            </button>
          </>
        )}
      </div>

      {/* Received Offers */}
      <div>
        <h4 style={{ color: '#fff' }}>Trade Offers</h4>
        {offers.filter(o => o.to === currentPlayerId && o.status === 'pending').map((offer, idx) => (
          <div key={idx} style={{ background: '#444', padding: '8px', marginBottom: '8px', borderRadius: '4px' }}>
            <div style={{ color: '#fff', fontSize: '12px' }}>
              From {players.find(p => p.id === offer.from)?.name}:
              Give {offer.giveTiles.join(', ')} for {offer.getAttractions.map(a => `${getAttractionInitial(a.type)}(${a.size})`).join(', ')}
            </div>
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
              <button
                onClick={() => onAcceptOffer(`${offer.from}-${idx}`)}
                style={{ padding: '4px 8px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px' }}
              >
                Accept
              </button>
              <button
                onClick={() => onRejectOffer(`${offer.from}-${idx}`)}
                style={{ padding: '4px 8px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '4px' }}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
