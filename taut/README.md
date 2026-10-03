# TAUT SPACE

A cooperative, simultaneous puzzle game. Every player has a problem they cannot solve alone:
each puzzle needs two pieces of information, and each piece is held by a *different* other player.
Talk, exchange information, and solve everyone's modules before the timer runs out.

> Everyone has a problem. Everyone has part of someone else's solution.

## Stack

- React 19 + TypeScript (Vite 7)
- Firebase Realtime Database (shared anonymous-auth project)

## Firebase

Taut reuses the same Firebase project as the other games in this repo (configuration lives in
[`src/firebase.ts`](src/firebase.ts)). It uses **anonymous auth** — no login UI — and stores every
room under the path:

```
games/taut/{6-digit room code}
```

Security rules live in the repo-root [`database.rules.json`](../../database.rules.json).

The Realtime DB is the single source of truth for multiplayer sync:

- Clients subscribe to a room with `onValue` (one listener each).
- The countdown is derived locally from a stored `globalEndTime` — **no interval-based writes**.
- Every client writes simultaneously; there is no turn locking. Strikes use a transaction.

## Scripts

This project is built with **bun**.

```sh
bun install      # install dependencies
bun run dev      # start the Vite dev server
bun run build    # type-check + production build
bun run lint     # eslint
bun run preview  # preview the production build
```

## How to play

1. Each player opens the app on their own device.
2. One player creates a room; others join with the 6-digit code.
3. Each player is dealt **one module** to operate, plus **two manual pages** that belong to *other*
   players. You can only read your pages out loud — you never see the info for your own module.
4. Solve all modules together before the timer hits zero, without exceeding the strike limit.

- **VICTORY:** every module is solved on the final level.
- **GAME_OVER:** the strike limit is reached, or the level timer expires.

### Difficulty & levels

Difficulty shortens the time and adds levels (each level re-deals one module per player with a
fresh countdown and a re-rolled information network):

| Difficulty | Levels | Time per level | Max strikes |
|-----------|--------|----------------|-------------|
| Beginner  | 1      | 8 min          | 6           |
| Standard  | 2      | 5 min          | 4           |
| Extreme   | 2      | 4 min          | 2           |

## Project layout

```
src/
  components/        UI (HUD, InfoPanel, module consoles)
  hooks/             useRoom, useCountdown, useUid
  lib/
    modules/         pure module logic (generate/info1/info2/verify/advance)
    gameConfig.ts    difficulties, min players, room codes
    rng.ts           host-side randomness helpers
  pages/             Home, Lobby, Room
  types/             strict Firebase DB schema (no `any`)
  utils/             room lifecycle + game write entry points
.ai_docs/            design docs: definition, plan, schema, module specs
```

See [`DEVELOPMENT_PLAN.md`](.ai_docs/DEVELOPMENT_PLAN.md) for the full phased build plan and
[`taut-definition.md`](.ai_docs/taut-definition.md) for the authoritative game definition.
