// Room.tsx - fixed version with end-game logic adjustments

import { useEffect, useMemo, useState } from "react"
import { db, ref, onValue, update, get } from "../firebase"
import { getPlayerId } from "../lib/playerId"
import Board from "../components/Board"
import Controls from "../components/Controls"
import type { Game, Player, Branch, ExplorerColor } from "../lib/types"
import { generateTilesMeta } from "../lib/deck"

const opp = (b: Branch): Branch => (b === "N" ? "S" : b === "S" ? "N" : b === "E" ? "W" : "E")

export default function Room({ gameId }: { gameId: string }) {
  // ... state & effects sama persis seperti sebelumnya ...

  // === helper endgame ===
  const computeEveryoneFinished = async (): Promise<boolean> => {
    const plist = await get(ref(db, `games/karuba/${gameId}/players`))
    const pObj: Record<string, Player> = (plist.val() || {}) as any
    return Object.values(pObj).every((p) => Object.keys(p.explorers || {}).length === 0)
  }
  const endGame = async () => {
    await update(ref(db, `games/karuba/${gameId}`), { status: "ended", statusText: "Game ended" })
  }

  // === maybeAutoFinishMe (FIXED) ===
  const maybeAutoFinishMe = async (newExplorers: any) => {
    try {
      if (!game || !me) return
      if (game.status !== "playing") return
      const noneLeft = !newExplorers || Object.keys(newExplorers).length === 0
      if (!noneLeft) return
      const pRef = ref(db, `games/karuba/${gameId}/players/${playerId}`)
      const updates: any = { doneForRound: true }
      if (game.currentTile > 0 && !me.actedForRound) {
        updates.actedForRound = true
        updates.lastAction = "auto"
      }
      await update(pRef, updates)
      // ❌ tidak panggil endGame di sini lagi
    } catch {}
  }

  // === enterTemple (FIXED) ===
  const enterTemple = async (color: ExplorerColor, side: Branch, index: number) => {
    try {
      if (!game || !me) return
      if (me.moves <= 0) return

      // ... existing code masuk temple, update score & explorers ...

      // setelah update state, cek global end condition:
      const everyoneFinished = await computeEveryoneFinished()
      if (everyoneFinished) {
        await endGame()
        return
      }
    } catch (e: any) {
      setError("Explorer step error: " + e.message)
    }
  }

  // === maybeAdvanceRound (FIXED) ===
  const maybeAdvanceRound = async () => {
    if (!game) return
    const plist = await get(ref(db, `games/karuba/${gameId}/players`))
    const pObj: Record<string, Player> = (plist.val() || {}) as any
    const allReady = Object.values(pObj).every((p) => p.doneForRound)
    if (!allReady) return

    const pids = order
    const nextRound = game.round + 1

    // end jika round habis > 36
    if (nextRound > 36) {
      await endGame()
      return
    }

    // ... lanjut update round ...
  }

  // ... sisanya sama dengan file Room.tsx sebelumnya ...
}
