import { handleCreateGame, handleJoinGame } from '../utils/lobby'

interface LobbyNameStepProps {
  gameId: string
  name: string
  setName: (name: string) => void
  playerId: string
}

export default function LobbyNameStep({ gameId, name, setName, playerId }: LobbyNameStepProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      <h2 className="font-display" style={{ marginBottom: 16 }}>Please input your name:</h2>
      <input
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: '100%', padding: '8px 12px', marginBottom: 12, borderRadius: 6, border: '1px solid #ccc', fontSize: 16 }}
      />
      <button
        className="font-display"
        style={{ width: '100%', padding: '10px', fontSize: 18, borderRadius: 6 }}
        onClick={async () => {
          const cleanId = gameId.replace(/\s/g, '')
          const { get, ref, db } = await import('../firebase')
          const gSnap = await get(ref(db, `games/karuba/${cleanId}`))
          if (!gSnap.exists()) {
            await handleCreateGame(gameId, name, playerId)
          } else {
            await handleJoinGame(gameId, name, playerId)
          }
        }}
      >
        Join!
      </button>
    </div>
  )
}
