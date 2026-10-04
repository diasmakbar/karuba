import type { InfoPayload } from "../lib/modules/contract";

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
/** ASCII maps/borders must keep their internal spacing; render them preformatted. */
function looksPreformatted(cell: string): boolean {
  return cell.includes("+---") || cell.trimStart().startsWith("|") || cell.startsWith("  ");
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
                    <td key={`${index}-${cellIndex}`} className={looksPreformatted(cell) ? "is-pre" : ""}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {table.note ? <p className="info-note">{table.note}</p> : null}
        </div>
      ))}
    </section>
  );
}
