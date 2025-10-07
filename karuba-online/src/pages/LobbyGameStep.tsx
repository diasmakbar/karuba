import { newGameId } from '../utils/lobby'

interface LobbyGameStepProps {
  gameId: string
  setGameId: (gameId: string) => void
  setStep: (step: 'game' | 'name') => void
}

export default function LobbyGameStep({ gameId, setGameId, setStep }: LobbyGameStepProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      <h2 className="font-display" style={{ marginBottom: 16 }}>Welcome to Karuba Online!</h2>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="123 456"
        value={gameId}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, '').slice(0, 6)
          setGameId(val)
        }}
        style={{ width: '100%', padding: '8px 12px', marginBottom: 12, borderRadius: 6, border: '1px solid #ccc', fontSize: 16 }}
      />
      <button
        className="font-display"
        style={{ width: '100%', marginBottom: 12, padding: '10px', fontSize: 18, borderRadius: 6 }}
        onClick={() => {
          if (/^\d{3}\s?\d{3}$/.test(gameId)) {
            setStep('name')
          } else {
            alert('Game ID must be 6 digits')
          }
        }}
      >
        Join Game!
      </button>
      <p style={{ marginTop: 12 }}>
        ... or create a{' '}
        <button
          className="font-display"
          style={{ padding: '4px 8px', fontSize: 16, borderRadius: 6 }}
          onClick={() => {
            setGameId(newGameId())
            setStep('name')
          }}
        >
          New Game
        </button>
      </p>
    </div>
  )
}
