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

  const renderParkSlot = (index: number, hasPark: boolean) => (
    <div
      key={`park-${index}`}
      style={{
        width: 35,
        height: 35,
        border: '1px solid #90EE90',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        backgroundColor: hasPark ? '#98FB98' : '#F0FFF0',
        margin: '1px'
      }}
    >
      {hasPark ? '🌳' : '⬜'}
    </div>
  );

  const renderStreet = (streetId: StreetId, street: any[]) => {
    const parkSlots = board.parkSlots[`street${streetId}` as keyof typeof board.parkSlots] as boolean[];

    return (
      <div key={streetId} style={{ margin: '0 10px', textAlign: 'center' }}>
        <h3 style={{ marginBottom: 10, fontSize: 16 }}>{t(`streets.street${streetId}`)}</h3>

        {/* House slots with inline park slots */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}>
          {street.map((slot, index) => (
            <div key={`house-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {renderSlot(streetId, index, slot)}
              {index < parkSlots.length && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>
                    Park {index + 1}
                  </div>
                  {renderParkSlot(index, parkSlots[index])}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: 20,
      maxWidth: 600,
      margin: '0 auto',
      overflowX: 'auto'
    }}>
      {renderStreet(1, board.street1)}
      {renderStreet(2, board.street2)}
      {renderStreet(3, board.street3)}
    </div>
  );
}
