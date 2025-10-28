import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Board from '../components/Board';
import { emptyPlayerBoard } from '../utils/lobby';
import type { PlayerBoard } from '../lib/types';

export default function Room() {
  const { id } = useParams<{ id: string }>();
  const [board] = useState<PlayerBoard>(emptyPlayerBoard());

  // Placeholder: in real implementation, sync with Firebase
  useEffect(() => {
    console.log('Room ID:', id);
  }, [id]);

  const handleSlotClick = (street: 1 | 2 | 3, index: number) => {
    // Placeholder action
    console.log('Clicked slot:', street, index);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Welcome to Your Perfect Home - Room {id}</h1>
      <Board board={board} onSlotClick={handleSlotClick} />
    </div>
  );
}
