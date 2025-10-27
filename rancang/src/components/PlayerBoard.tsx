// src/components/PlayerBoard.tsx

import type { Street, StreetType, House } from '../game/types';

interface PlayerBoardProps {
  streets: Record<StreetType, Street>;
  onHouseClick?: (street: StreetType, houseIndex: number) => void;
  onPoolClick?: (street: StreetType, houseIndex: number) => void;
  onParkClick?: (street: StreetType, houseIndex: number) => void;
  onFenceClick?: (street: StreetType, houseIndex: number) => void;
}

const STREET_LENGTHS: Record<StreetType, number> = {
  'A': 10,
  'B': 11,
  'C': 12
};

const STREET_NAMES: Record<StreetType, string> = {
  'A': 'Street A',
  'B': 'Street B',
  'C': 'Street C'
};

export default function PlayerBoard({
  streets,
  onHouseClick,
  onPoolClick,
  onParkClick,
  onFenceClick
}: PlayerBoardProps) {
  const renderHouse = (street: StreetType, house: House, index: number) => {
    const hasNumber = house.number !== null;
    const canBuildPool = hasNumber && !house.hasPool;
    const canBuildPark = hasNumber && !house.hasPark;

    return (
      <div
        key={index}
        className="house-cell"
        style={{
          position: 'relative',
          width: '60px',
          height: '80px',
          border: '2px solid #333',
          borderRadius: '4px',
          background: hasNumber ? '#f0f0f0' : '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: onHouseClick ? 'pointer' : 'default',
          margin: '2px'
        }}
        onClick={() => onHouseClick?.(street, index)}
      >
        {/* House number */}
        <div
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: hasNumber ? '#000' : '#ccc'
          }}
        >
          {house.number || '?'}
        </div>

        {/* Pool indicator */}
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: '2px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: house.hasPool ? '#00f' : canBuildPool ? '#ccc' : 'transparent',
            cursor: canBuildPool && onPoolClick ? 'pointer' : 'default',
            border: canBuildPool ? '1px solid #999' : 'none'
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (canBuildPool) onPoolClick?.(street, index);
          }}
        />

        {/* Park indicator */}
        <div
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '12px',
            height: '12px',
            background: house.hasPark ? '#0f0' : canBuildPark ? '#ccc' : 'transparent',
            cursor: canBuildPark && onParkClick ? 'pointer' : 'default',
            border: canBuildPark ? '1px solid #999' : 'none',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (canBuildPark) onParkClick?.(street, index);
          }}
        />

        {/* Fence indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '2px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            height: '3px',
            background: house.hasFence ? '#8B4513' : 'transparent',
            cursor: onFenceClick ? 'pointer' : 'default'
          }}
          onClick={(e) => {
            e.stopPropagation();
            onFenceClick?.(street, index);
          }}
        />
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Your City</h3>

      {(Object.keys(streets) as StreetType[]).map((streetType) => {
        const street = streets[streetType];
        const length = STREET_LENGTHS[streetType];

        return (
          <div key={streetType} style={{ marginBottom: '30px' }}>
            <h4 style={{ marginBottom: '10px', textAlign: 'center' }}>
              {STREET_NAMES[streetType]} ({length} houses)
            </h4>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              {Array.from({ length }, (_, index) => {
                const house = street.houses[index] || { number: null, hasPool: false, hasPark: false, hasFence: false };
                return renderHouse(streetType, house, index);
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
