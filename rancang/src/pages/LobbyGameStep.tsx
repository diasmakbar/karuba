import { newGameId } from '../utils/lobby';
import { useLang } from '../contexts/LangContext';

interface LobbyGameStepProps {
  gameId: string;
  setGameId: (gameId: string) => void;
  setStep: (step: 'game' | 'name') => void;
  mode: "classic" | "balanced";
  setMode: (mode: "classic" | "balanced") => void;
  includeAdvanced: boolean;
  setIncludeAdvanced: (include: boolean) => void;
}

export default function LobbyGameStep({
  gameId,
  setGameId,
  setStep,
  mode,
  setMode,
  includeAdvanced,
  setIncludeAdvanced
}: LobbyGameStepProps) {
  const { t } = useLang();

  return (
    <div style={{ textAlign: 'center' }}>
      <h2 className="font-display" style={{ marginBottom: 16 }}>{t('lobby.welcome')}</h2>

      {/* Game Mode */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>{t('lobby.gameMode')}</label>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button
            className={`font-display ${mode === 'classic' ? 'active' : ''}`}
            onClick={() => setMode('classic')}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #ccc',
              background: mode === 'classic' ? '#007bff' : '#fff',
              color: mode === 'classic' ? '#fff' : '#000',
              cursor: 'pointer'
            }}
          >
            {t('lobby.classic')}
          </button>
          <button
            className={`font-display ${mode === 'balanced' ? 'active' : ''}`}
            onClick={() => setMode('balanced')}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #ccc',
              background: mode === 'balanced' ? '#007bff' : '#fff',
              color: mode === 'balanced' ? '#fff' : '#000',
              cursor: 'pointer'
            }}
          >
            {t('lobby.balanced')}
          </button>
        </div>
      </div>

      {/* Advanced Plans */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={includeAdvanced}
            onChange={(e) => setIncludeAdvanced(e.target.checked)}
          />
          <span>{t('lobby.includeAdvanced')}</span>
        </label>
      </div>

      {/* Game ID Input */}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="123 456"
        value={gameId}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
          setGameId(val);
        }}
        style={{
          width: '100%',
          padding: '8px 12px',
          marginBottom: 12,
          borderRadius: 6,
          border: '1px solid #ccc',
          fontSize: 16
        }}
      />

      <button
        className="font-display"
        style={{ width: '100%', marginBottom: 12, padding: '10px', fontSize: 18, borderRadius: 6 }}
        onClick={() => {
          if (/^\d{3}\s?\d{3}$/.test(gameId)) {
            setStep('name');
          } else {
            alert('Game ID must be 6 digits');
          }
        }}
      >
        {t('lobby.joinGame')}
      </button>

      <p style={{ marginTop: 12 }}>
        ... or create a{' '}
        <button
          className="font-display"
          style={{
            padding: '4px 8px',
            fontSize: 16,
            borderRadius: 6,
            background: '#28a745',
            color: '#fff',
            border: 'none',
            cursor: 'pointer'
          }}
          onClick={() => {
            setGameId(newGameId());
            setStep('name');
          }}
        >
          {t('lobby.createNew')}
        </button>
      </p>
    </div>
  );
}
