# MOD_02 Invisible Maze — Bugfix Plan

## Problem 1: Every button press causes a STRIKE

### Root cause
The puzzle is multi-step, but [`verify()`](../../taut/src/lib/modules/mod02InvisibleMaze.ts) returns
`true` only when a single press lands exactly on `finishCoord`:

```ts
verify: (vars, answer) => {
  const next = nextCoord(...);
  return next !== null && next === vars.finishCoord; // <-- only true at the exit
}
```

[`submitModuleAnswer()`](../../taut/src/utils/game.ts) treats `verify === false` as a STRIKE. So any
legal intermediate move (a valid step that does not yet reach the exit) is scored as a strike.
That is why every press strikes — the player can never take more than one step.

### Convention (confirmed in MOD_04)
In [`mod04SequenceProtocol.ts`](../../taut/src/lib/modules/mod04SequenceProtocol.ts):
- `verify` = "is this step legal/correct for the current stage"
- `advance` returns `null` only on the FINAL step, marking the module solved.

### Fix
Mirror MOD_04 semantics:
- [`verify()`] returns `true` whenever the mapped move is legal (`nextCoord(...) !== null`).
- [`advance()`] returns `null` when the legal move reaches `finishCoord` (module solved), otherwise
  returns the updated `currentCoord`.

```ts
verify: (vars, answer) => {
  const command = commandFor(vars.serialNumber, answer.direction);
  return nextCoord(vars.mazeId, vars.currentCoord, command) !== null;
},
advance: (vars, answer) => {
  const command = commandFor(vars.serialNumber, answer.direction);
  const next = nextCoord(vars.mazeId, vars.currentCoord, command);
  if (next === null) return { ...vars };        // illegal (verify already struck)
  if (next === vars.finishCoord) return null;   // reached exit -> solved
  return { ...vars, currentCoord: next };
},
```

## Problem 2: ASCII map loses alignment

### Root cause
The browser collapses runs of spaces in `<td>`. [`InfoPanel`](../../taut/src/components/InfoPanel.tsx)
marks cells `is-pre` (white-space: pre) only when they contain `+---`, start with `|`, or start with
two spaces. Border rows that are ALL gaps — e.g. `+   +   +   +   +   +   +` — match none of these,
so they collapse to `+ + + + + + +`.

### Fix
Broaden `looksPreformatted()` to also treat any cell that starts with `+` or `|`, or that contains a
run of 2+ spaces, as preformatted:

```ts
function looksPreformatted(cell: string): boolean {
  return /[+|]/.test(cell.charAt(0)) || / {2,}/.test(cell);
}
```

This covers header (`  A   B ...`), borders (`+---+...`), gap borders (`+   +...`), and cell rows
(`| ... |`).

## Map correctness (Beta is WRONG — must fix)
Alpha ASCII map decodes to exactly the spec wall list (all 14 walls match).

Beta does NOT: decoding the current Beta art against its `WALLED_EDGES` shows the wall rows/columns
are shifted (e.g. the art puts a wall at `C1|D1` correctly, but rows H1, H3, H4 and cell rows 2/3/5
contradict the edge list). If Info 1 shows a map that disagrees with the validation edges, players
are guided into walls.

### Preferred fix: generate the ASCII map from `WALLED_EDGES`
Hand-authoring three 14-line maps is error-prone. Instead, derive the display map from the single
source of truth (`WALLED_EDGES`) so the manual can never drift from the validator.

Sketch:
```ts
function edgeSet(mazeId: MazeId): Set<string> {
  return new Set(WALLED_EDGES[mazeId]); // entries "A1|A2"
}
function hasWall(set: Set<string>, a: string, b: string): boolean {
  return set.has(`${a}|${b}`) || set.has(`${b}|${a}`);
}
export function renderMaze(mazeId: MazeId): string[] {
  const set = edgeSet(mazeId);
  const lines = ["  A   B   C   D   E   F", "+---+---+---+---+---+---+"];
  for (let r = 1; r <= 6; r++) {
    // cell row
    let row = "";
    for (let c = 0; c < 6; c++) {
      row += "|";
      const here = `${COLUMNS[c]}${r}`;
      const right = COLUMNS[c + 1] ? `${COLUMNS[c + 1]}${r}` : null;
      row += hasWall(set, here, right ?? here) && right ? "   " : "   ";
      // note: draw vertical wall by swapping the "" separator glyph
    }
    lines.push(row);
    if (r < 6) {
      // horizontal separator row
      let sep = "+";
      for (let c = 0; c < 6; c++) {
        const here = `${COLUMNS[c]}${r}`;
        const below = `${COLUMNS[c]}${r + 1}`;
        sep += (hasWall(set, here, below) ? "---" : "   ") + "+";
      }
      lines.push(sep);
    }
  }
  lines.push("+---+---+---+---+---+---+");
  return lines;
}
```
Then [`MAZE_ARCHITECTURE`] becomes a function call rather than hand-drawn strings, guaranteeing the
map displayed in Info 1 always matches the edges used by [`nextCoord()`].

### Alternative (if generation is undesirable)
Hand-fix the Beta and Gamma maps so every wall glyph matches their `WALLED_EDGES`. Higher risk of
drift. Not recommended.

## Root cause table for Problem 1 (restated)
The displayed map is NOT the cause of the strikes; the `verify` semantics are. Fix both independently.

## Verification
- Unit: from a random cell, a legal move yields `verify === true` and `advance` moves the token.
- Moving into a wall yields `verify === false` (strike).
- Reaching the exit yields `advance === null` (solved).
- Info panel: all map lines (header, borders, gap borders, cell rows) render monospace and aligned.
