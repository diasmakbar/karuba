import type { InfoPayload, MazeGrid } from "../lib/modules/contract";

interface InfoPanelProps {
  moduleName: string;
  ownerName: string;
  page: 1 | 2;
  tables: InfoPayload;
}

/**
 * A manual page. Informants only ever read these tables out loud — the row marked
 * `highlight` is the one that applies to the module the owner is holding.
 */
/** Border widths per edge: a shared wall draws thick where a move is blocked. */
function hasWall(walls: readonly string[], a: string, b: string): boolean {
  return walls.includes(`${a}|${b}`) || walls.includes(`${b}|${a}`);
}

function MazeMap({ grid }: { grid: MazeGrid }) {
  return (
    <div className="maze-map" style={{ gridTemplateColumns: `auto repeat(${grid.columns.length}, 1fr)` }}>
      <span className="maze-label" />
      {grid.columns.map((column) => (
        <span key={column} className="maze-label">
          {column}
        </span>
      ))}
      {grid.rows.map((row) => (
        <MazeRow key={row} grid={grid} row={row} />
      ))}
    </div>
  );
}

function MazeRow({ grid, row }: { grid: MazeGrid; row: number }) {
  return (
    <>
      <span className="maze-label">{row}</span>
      {grid.columns.map((column) => {
        const here = `${column}${row}`;
        const up = `${column}${row - 1}`;
        const down = `${column}${row + 1}`;
        const left = `${grid.columns[grid.columns.indexOf(column) - 1]}${row}`;
        const right = `${grid.columns[grid.columns.indexOf(column) + 1]}${row}`;
        const classes = ["maze-cell"];
        if (hasWall(grid.walls, here, up)) classes.push("wall-top");
        if (hasWall(grid.walls, here, down)) classes.push("wall-bottom");
        if (hasWall(grid.walls, here, left)) classes.push("wall-left");
        if (hasWall(grid.walls, here, right)) classes.push("wall-right");
        return <div key={here} className={classes.join(" ")} />;
      })}
    </>
  );
}

export function InfoPanel({ moduleName, ownerName, page, tables }: InfoPanelProps) {
  return (
    <section className="info-card">
      <header className="info-card-head">
        <div>
          <h3 className="module-title">{moduleName}</h3>
          <p className="info-owner">Held by {ownerName}</p>
        </div>
        <span className={`badge is-${page}`}>Info {page}</span>
      </header>

      {tables.map((table) => (
        <div key={table.title} className="stack">
          {table.grid ? (
            <>
              <p className="info-note" style={{ fontWeight: 700 }}>{table.title}</p>
              <MazeMap grid={table.grid} />
            </>
          ) : (
            <table className="info-table">
              <caption>{table.title}</caption>
              <thead>
                <tr>
                  {table.columns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, index) => (
                  <tr key={`${table.title}-${index}`} className={row.highlight ? "is-active" : ""}>
                    {row.cells.map((cell, cellIndex) => (
                      <td key={`${index}-${cellIndex}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {table.note ? <p className="info-note">{table.note}</p> : null}
        </div>
      ))}
    </section>
  );
}
