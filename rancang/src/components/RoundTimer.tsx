import { useEffect, useState } from 'react';

interface RoundTimerProps {
  endTime: number | null;
  onTimeUp: () => void;
}

export default function RoundTimer({ endTime, onTimeUp }: RoundTimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!endTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        onTimeUp();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getColor = () => {
    if (timeLeft <= 60) return '#f44336'; // red
    if (timeLeft <= 120) return '#ff9800'; // orange
    return '#4caf50'; // green
  };

  if (!endTime) return null;

  return (
    <div style={{
      background: '#2d2d2d',
      padding: '12px',
      borderRadius: '8px',
      textAlign: 'center',
      marginBottom: '16px'
    }}>
      <div style={{ color: '#fff', fontSize: '14px', marginBottom: '4px' }}>
        Negotiation Time
      </div>
      <div style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: getColor(),
        fontFamily: 'monospace'
      }}>
        {formatTime(timeLeft)}
      </div>
      {timeLeft <= 60 && timeLeft > 0 && (
        <div style={{ color: '#f44336', fontSize: '12px', marginTop: '4px' }}>
          Hurry up!
        </div>
      )}
    </div>
  );
}
