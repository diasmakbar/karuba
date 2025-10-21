import { getMaxTileCount } from '../game/config'
import type { Player, GameConfig } from '../game/types'

export function newGameId(): string {
  const num = Math.floor(100000 + Math.random() * 900000).toString()
  return num.slice(0, 3) + ' ' + num.slice(3)
}

export async function handleCreateGame(gameId: string, name: string, playerId: string, color: string) {
  const cleanId = gameId.replace(/\s/g, '')
  if (!name.trim()) {
    alert('Enter your name!')
    return
  }

  const playerCount = 5 // default, bisa diubah nanti
  const maxTiles = getMaxTileCount(playerCount)

  const gamePayload: Partial<GameConfig> & any = {
    status: 'lobby',
    statusText: 'Waiting for players to join',
    playerCount,
    maxTiles,
    currentRound: 0,
    totalRounds: 4,
    negotiationEndTime: null,
  }

  const { db, ref, set } = await import('../firebase/client')
  await set(ref(db, `games/rancang/${cleanId}`), gamePayload)
  await set(
    ref(db, `games/rancang/${cleanId}/players/${playerId}`),
    createPlayerPayload(playerId, name.trim(), playerCount, color)
  )

  history.pushState({ playerName: name.trim() }, '', `/room/${cleanId}`)
  dispatchEvent(new PopStateEvent('popstate'))
}

export async function handleJoinGame(gameId: string, name: string, playerId: string, color: string) {
  const cleanId = gameId.replace(/\s/g, '')
  if (!name.trim()) {
    alert('Enter your name!')
    return
  }
  if (!/^\d{6}$/.test(cleanId)) {
    alert('Invalid Game ID')
    return
  }

  const { db, ref, get, set, update } = await import('../firebase/client')
  const gSnap = await get(ref(db, `games/rancang/${cleanId}`))
  if (!gSnap.exists()) {
    alert('Game not found!')
    return
  }

  const gameData = gSnap.val()
  const pSnap = await get(ref(db, `games/rancang/${cleanId}/players/${playerId}`))
  if (!pSnap.exists()) {
    await set(
      ref(db, `games/rancang/${cleanId}/players/${playerId}`),
      createPlayerPayload(playerId, name.trim(), gameData.playerCount || 5, color)
    )
    const playersSnap = await get(ref(db, `games/rancang/${cleanId}/players`))
    const count = playersSnap.exists() ? Object.keys(playersSnap.val() || {}).length : 1
    await update(ref(db, `games/rancang/${cleanId}`), { playerCount: count })
  }

  history.pushState({ playerName: name.trim() }, '', `/room/${cleanId}`)
  dispatchEvent(new PopStateEvent('popstate'))
}

function createPlayerPayload(id: string, pname: string, playerCount: number, color: string): Player {
  return {
    id,
    name: pname,
    color,
    coins: playerCount, // initial coins = player count
    tiles: [],
    attractions: [],
    doneNegotiating: false,
  }
}
