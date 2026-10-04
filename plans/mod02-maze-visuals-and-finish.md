# MOD_02 Invisible Maze — Visual Clarity + Finish Landing

## Problem A: Start / Finish / Token are not visually distinct

Today [`InvisibleMazeConsole`](../../taut/src/components/modules/InvisibleMazeConsole.tsx) draws:
- token `◉`, finish `◎`, start `○`
- but the class list only sets `is-active` (token) and `is-target` (finish). Start has **no
  style**, so it looks like an empty cell. Overlap cases (start==token at spawn) and the
  finish cell color are weak.

### Proposal
Give each role a distinct, unambiguous visual, driven by dedicated classes:

| Role | Class | Look |
|------|-------|------|
| Start | `is-start` | hollow ring, muted outline, letter `S` |
| Finish | `is-finish` | green ring, letter `F` |
| Token | `is-token` | filled accent disc (always drawn ON TOP) |
| Token on finish | `is-token is-finish` | accent disc inside green ring + quick pulse |

Rules:
- Render order so the token always wins visually when it shares a cell with start/finish.
- Show `S`/`F` only when the token is NOT on that cell (avoid glyph stacking).
- Use `.cell.is-start`, `.cell.is-finish`, `.cell.is-token` classes (reuse existing palette vars).

Console change (sketch):
```tsx
const coord = `${column}${row}`;
const isToken = displayCoord === coord;
const isFinish = localVars.finishCoord === coord;
const isStart = localVars.startCoord === coord;
const cls = ["cell",
  isStart ? "is-start" : "",
  isFinish ? "is-finish" : "",
  isToken ? "is-token" : ""].join(" ");
const glyph = isToken ? "◉" : isFinish ? "F" : isStart ? "S" : "";
```

## Problem B: the winning move does not visibly move the token onto the finish

[`submitModuleAnswer()`](../../taut/src/utils/game.ts) writes `localVars: advanced ?? state.localVars`.
When [`advance()`](../../taut/src/lib/modules/mod02InvisibleMaze.ts) returns `null` (module finished),
the OLD `currentCoord` is persisted, so the token stays on the pre-finish cell while the module flips
to solved. The player never sees the token enter the exit.

### Proposal (surgical, no contract change)
The contract treats `advance() === null` as "finished" ([contract.ts]). Changing that affects every
module. Instead, the console derives the DISPLAYED token position from solved state:

```tsx
const displayCoord = state.isSolved ? localVars.finishCoord : localVars.currentCoord;
```

- While playing: token follows `localVars.currentCoord`.
- On solve: token snaps to `localVars.finishCoord`, so the final press is visibly accepted and the
  token sits in the exit cell under the green finish ring.

This keeps the pure module logic untouched and fixes the perceived gap. (The host state still stores
the last legal cell; the visual is a presentation concern, which matches the console's role.)

### Alternative considered (rejected)
Have `advance()` return `{ ...vars, currentCoord: finishCoord }` AND a separate finished flag — would
require changing the `ModuleDefinition` contract and every multi-step module. Too invasive.

## Files to touch
- [`InvisibleMazeConsole.tsx`](../../taut/src/components/modules/InvisibleMazeConsole.tsx): add
  `displayCoord`, role classes, `S`/`F`/token glyphs, render ordering.
- [`styles.css`](../../taut/src/styles.css): add `.cell.is-start`, adjust `.cell.is-finish`,
  strengthen `.cell.is-token`, add a subtle solved pulse.
- (No changes to `contract.ts`, `game.ts`, or `mod02InvisibleMaze.ts` required.)

## Verification
- Spawn: token occupies the start cell; start ring hidden behind token; finish shows `F`.
- Mid-play: token moves cell by cell; start still shows `S`; finish still shows `F`.
- Winning press: token lands on and remains in the finish cell, green ring visible, success flash.
- Strike: token does not move; strike flash fires.
