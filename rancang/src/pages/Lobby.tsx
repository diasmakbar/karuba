import { useState } from 'react'
import { getPlayerId } from '../lib/playerId'
import { handleCreateGame, handleJoinGame } from '../utils/lobby'
import LobbyGameStep from './LobbyGameStep'
import LobbyNameStep from './LobbyNameStep'
import LobbyColorStep from './LobbyColorStep'

export default function Lobby() {
  const [step, setStep] = useState<'game' | 'name' | 'color'>('game')
  const [gameId, setGameId] = useState('')
  const [name, setName] = useState('')
  const [color, setColor] = useState('')
  const playerId = getPlayerId(name)

  const handleJoin = async () => {
    const cleanId = gameId.replace(/\s/g, '')
    const { get, ref, db } = await import('../firebase/client')
    const gSnap = await get(ref(db, `games/rancang/${cleanId}`))
    if (!gSnap.exists()) {
      await handleCreateGame(gameId, name, playerId, color)
    } else {
      await handleJoinGame(gameId, name, playerId, color)
    }
  }

  return (
    <main className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="page-inner" style={{
        width: 360,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="card" style={{
          padding: 24,
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          width: '100%'
        }}>
          <h1 style={{ textAlign: 'center', marginBottom: 16, fontSize: 24 }}>Rancang</h1>
          {step === 'game' && (
            <LobbyGameStep gameId={gameId} setGameId={setGameId} setStep={setStep} />
          )}

          {step === 'name' && (
            <LobbyNameStep name={name} setName={setName} setStep={setStep} />
          )}
          {step === 'color' && (
            <LobbyColorStep gameId={gameId} name={name} color={color} setColor={setColor} onJoin={handleJoin} />
          )}
        </div>
      </div>
    </main>
  )
}
