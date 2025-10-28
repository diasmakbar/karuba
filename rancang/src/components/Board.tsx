import type { PlayerBoard, StreetId } from '../lib/types';
import { useLang } from '../contexts/LangContext';

interface BoardProps {
  board: PlayerBoard;
  onSlotClick?: (street: StreetId, index: number) => void;
}

export default function Board({ board, onSlotClick }: BoardProps) {
  const { t } = useLang();

  const renderSlot = (street: StreetId, index: number, slot: any) => {
    let emoji = '⬜'; // empty
    let overlay = '';

    if (slot.number) {
      emoji = '🏠'; // house
    }

    // Show pool icon if position has pool available
    if (slot.poolPosition) {
      overlay = slot.hasPool ? '🏊' : '🏊‍♂️'; // built vs available
    }

    if (slot.hasPark) {
      overlay = '🌳'; // park
    }

    if (slot.hasFence) {
      overlay = '🚧'; // fence
    }

    return (
      <div
        key={index}
        onClick={() => onSlotClick?.(street, index)}
        style={{
          width: 40,
          height: 40,
          border: '1px solid #ccc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          cursor: onSlotClick ? 'pointer' : 'default',
          backgroundColor: slot.number ? '#f0f8ff' : '#fff',
          position: 'relative'
        }}
      >
        <div>{slot.number || emoji}</div>
        {overlay && <div style={{ fontSize: 12, position: 'absolute', bottom: 2 }}>{overlay}</div>}
      </div>
    );
  };

  const renderStreet = (streetId: StreetId, street: any[]) => (
    <div key={streetId} style={{ marginBottom: 20 }}>
      <h3 style={{ textAlign: 'center', marginBottom: 10 }}>{t(`streets.street${streetId}`)}</h3>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }}>
        {street.map((slot, index) => renderSlot(streetId, index, slot))}
      </div>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 20,
      maxWidth: 400,
      margin: '0 auto'
    }}>
      {renderStreet(1, board.street1)}
      {renderStreet(2, board.street2)}
      {renderStreet(3, board.street3)}
    </div>
  );
}
