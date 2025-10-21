import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db, ref, onValue } from '../firebase/client';
import { getPlayerId } from '../lib/playerId';
import { startGame, selectTiles, endNegotiation, updateAttraction } from '../utils/room';
import GameBoard from '../components/GameBoard';
import LandSelectionTest from '../components/LandSelectionTest';
import BuildModal from '../components/BuildModal';
import type { GameConfig, Player, Attraction } from '../game/types';

export default function Room() {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<GameConfig | null>(null);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const [blinkingTiles, setBlinkingTiles] = useState<number[]>([]);
  const [tilesSubmitted, setTilesSubmitted] = useState(false);
  // builtAttractions from player state
  const [buildMode, setBuildMode] = useState<number | null>(null); // tile being built
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
  const handleSelectTiles = (tiles: number[]) => selectTiles(gameId!, playerId, tiles);
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

          {game.status === 'distributing' && me.tiles && !tilesSubmitted && (
            <LandSelectionTest
              maxTile={game.maxTiles}
              playerCount={game.playerCount || 5}
              round={game.currentRound || 1}
              playerColor={me.color || '#4caf50'}
              tilePool={me.tiles}
              onSelected={(tiles, attractions) => {
                setSelectedTiles(tiles);
                setTilesSubmitted(true);
                setBlinkingTiles([]); // Stop blinking on submit
                handleSelectTiles(tiles);
                // Attractions could be stored or sent later
              }}
              onUpdateBlinkingTiles={setBlinkingTiles}
            />
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
          ownedTiles={{
            ...Object.fromEntries(selectedTiles.map(t => [t, playerId]))
          }}
          playerColors={Object.fromEntries(
            Object.values(players).map(p => [p.id, p.color])
          )}
          builtAttractions={me.builtAttractions || {}}
          onTileClick={game.status === 'negotiation' ? (tile) => {
            if (selectedTiles.includes(tile)) {
              const current = me.builtAttractions?.[tile];
              if (current) {
                // Remove the built attraction
                updateAttraction(gameId!, playerId, tile, null);
                setBuildMode(tile); // reopen modal for rebuild
              } else {
                setBuildMode(tile); // open modal to build
              }
            }
          } : undefined}
          selectedTilesForBlink={blinkingTiles}
        />

        {buildMode && (
          <BuildModal
            attractions={me.attractions}
            playerColor={me.color || '#4caf50'}
            onSelect={(attraction) => {
              updateAttraction(gameId!, playerId, buildMode, attraction);
              setBuildMode(null);
            }}
            onCancel={() => setBuildMode(null)}
          />
        )}
      </div>
    </main>
  );
}
