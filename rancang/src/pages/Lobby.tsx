import { useState } from 'react'
import { getPlayerId } from '../lib/playerId'
import LobbyGameStep from './LobbyGameStep'
import LobbyNameStep from './LobbyNameStep'

export default function Lobby() {
  const [step, setStep] = useState<'game' | 'name'>('game')
  const [gameId, setGameId] = useState('')
  const [name, setName] = useState('')
  const playerId = getPlayerId(name)

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
            <LobbyNameStep gameId={gameId} name={name} setName={setName} playerId={playerId} />
          )}
        </div>
      </div>
    </main>
  )
}
