# [MASTER CONTEXT: TAUT SPACE]

ROLE: Expert Full-Stack Developer.
STACK: React + TypeScript (Vite), Firebase Realtime DB.
ARCHITECTURE_RULES:
- Strict TypeScript: No `any` types. Define interfaces for all state in `db-schema.ts`.
- Separation of Concerns: Logic and Firebase interactions go to `utils/` or `hooks/`. UI goes to `components/` and `pages/`.
- Firebase: Minimize reads/writes. Use listeners (`onValue`) for sync. Do not use interval-based writes for timers.
- State: Rely on Firebase as the single source of truth for multiplayer sync.
- Simultaneous Action: Do not use turn-based locking. Allow parallel, immediate state updates from all clients.
- Error Handling: Fail gracefully and provide UI feedback for network latency.