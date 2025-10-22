interface LobbyNameStepProps {
  name: string
  setName: (name: string) => void
  setStep: (step: 'game' | 'name' | 'color') => void
}

export default function LobbyNameStep({ name, setName, setStep }: LobbyNameStepProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ marginBottom: 16 }}>Please input your name:</h2>
      <input
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: '100%', padding: '8px 12px', marginBottom: 12, borderRadius: 6, border: '1px solid #ccc', fontSize: 16 }}
      />
      <button
        style={{ width: '100%', padding: '10px', fontSize: 18, borderRadius: 6 }}
        onClick={() => setStep('color')}
        disabled={!name.trim()}
      >
        Next
      </button>
    </div>
  )
}
