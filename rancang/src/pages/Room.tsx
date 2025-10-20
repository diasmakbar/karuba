import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db, ref, onValue } from '../firebase/client';
import { getPlayerId } from '../lib/playerId';
import { startGame, selectTiles, endNegotiation } from '../utils/room';
import GameBoard from '../components/GameBoard';
import type { GameConfig, Player } from '../game/types';

export default function Room() {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<GameConfig | null>(null);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const playerName = (history.state as any)?.playerName || 'Unknown';
  const playerId = getPlayerId(playerName);
  const me = players[playerId];
  const isHost = me && Object.keys(players).indexOf(playerId) === 0;

  useEffect(() => {
    if (!gameId) return;
    const off1 = onValue(ref(db, `games/rancang/${gameId}`), (s) => setGame(s.val()));
    const off2 = onValue(ref(db, `games/rancang/${gameId}/players`), (s) => setPlayers(s.val() || {}));
    return () => { off1(); off2() };
  }, [gameId]);

  if (!game || !me) return <div>Loading game...</div>;

  const handleStartGame = () => startGame(gameId!, players);
  const handleSelectTiles = () => selectTiles(gameId!, playerId, selectedTiles);
  const handleDoneNegotiating = () => endNegotiation(gameId!, players);

  return (
    <main className="page">
      <div className="page-inner">
        <div className="card" style={{ padding: 20 }}>
          <h2>Rancang - Game {gameId}</h2>
          <p>Status: {game.statusText}</p>
          <p>Round: {game.currentRound} / {game.totalRounds}</p>
          <p>Players: {Object.keys(players).length}</p>

          {game.status === 'lobby' && isHost && (
            <button onClick={handleStartGame}>Start Game</button>
          )}

          {game.status === 'distributing' && me.tiles && (
            <div>
              <p>Select 3 tiles:</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {me.tiles.map(tile => {
                  const isSelected = selectedTiles.includes(tile);
                  return (
                    <button
                      key={tile}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTiles(prev => prev.filter(t => t !== tile));
                        } else if (selectedTiles.length < 3) {
                          setSelectedTiles(prev => [...prev, tile]);
                        }
                      }}
                      style={{
                        width: '50px',
                        height: '50px',
                        background: isSelected ? '#4caf50' : '#555',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      {tile}
                    </button>
                  );
                })}
              </div>
              <p>Selected: {selectedTiles.join(', ')}</p>
              <button onClick={handleSelectTiles} disabled={selectedTiles.length !== 3}>
                Submit Tiles ({selectedTiles.length}/3)
              </button>
            </div>
          )}

          {game.status === 'negotiation' && (
            <div>
              <p>Negotiate! Time left: {game.negotiationEndTime ? Math.max(0, Math.floor((game.negotiationEndTime - Date.now()) / 1000)) : 0}s</p>
              <button onClick={handleDoneNegotiating}>Done Negotiating</button>
            </div>
          )}

          <ul>
            {Object.values(players).map((p) => (
              <li key={p.id}>
                {p.name} - Coins: {p.coins}
                {p.attractions && <span> Attractions: {p.attractions.length}</span>}
              </li>
            ))}
          </ul>
        </div>

        <GameBoard
          n={game.maxTiles}
          ownedTiles={selectedTiles}
          submittedTiles={selectedTiles}
        />
      </div>
    </main>
  );
}
