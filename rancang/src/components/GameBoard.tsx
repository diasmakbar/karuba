// src/components/GameBoard.tsx

interface Cell {
  n: number;
  x: number;
  y: number;
}

function generateSpiralGrid(nMax: number): Cell[] {
  let x = 0, y = 0;
  let dx = 1, dy = 0;
  let steps = 1;
  let n = 1;

  const out: Cell[] = [{ n, x, y }];
  n++;

  while (n <= nMax) {
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < steps; j++) {
        if (n > nMax) break;
        x += dx;
        y += dy;
        out.push({ n, x, y });
        n++;
      }
      [dx, dy] = [-dy, dx];
    }
    steps++;
  }

  return out.map((cell) =>
    cell.y % 2 !== 0 ? { ...cell, x: cell.x + 0.5 } : cell
  );
}

interface GameBoardProps {
  n?: number;
  ownedTiles?: number[]; // tambahan: tile yang dimiliki
  submittedTiles?: number[];
}

export default function GameBoard({ n = 36, ownedTiles = [], submittedTiles = [] }: GameBoardProps) {
  const cells = generateSpiralGrid(n);

  const minX = Math.min(...cells.map(c => c.x));
  const maxX = Math.max(...cells.map(c => c.x));
  const minY = Math.min(...cells.map(c => c.y));
  const maxY = Math.max(...cells.map(c => c.y));

  const gridSizeX = maxX - minX + 1.5;
  const gridSizeY = maxY - minY + 1;
  const tileSize = 50;

  const boardWidth = gridSizeX * tileSize;
  const boardHeight = gridSizeY * tileSize;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: '#1e1e1e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '100vw',
          maxHeight: '100vh',
          overflow: 'auto',
          border: '1px solid #444',
          borderRadius: '8px',
          background: '#2d2d2d',
          boxShadow: '0 0 20px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: `${boardWidth}px`,
            height: `${boardHeight}px`,
            padding: '20px',
          }}
        >
          {cells.map((cell) => {
            const isOwned = ownedTiles.includes(cell.n);
            const isSubmitted = submittedTiles?.includes(cell.n);
            return (
              <div
                key={cell.n}
                style={{
                  position: 'absolute',
                  left: `${(cell.x - minX) * tileSize}px`,
                  top: `${(cell.y - minY) * tileSize}px`,
                  width: `${tileSize}px`,
                  height: `${tileSize}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#fff',
                  background: isOwned ? '#2a6f4e' : '#333', // hijau kalau dimiliki
                  border: isSubmitted
                    ? '3px solid #2196f3' // biru tebal kalau submitted
                    : isOwned
                    ? '2px solid #4caf50'
                    : '1px solid #666',
                //   border: isOwned ? '2px solid #4caf50' : '1px solid #666',
                  borderRadius: '4px',
                  userSelect: 'none',
                }}
              >
                {cell.n}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}