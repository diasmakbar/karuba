import type { InfoPayload, InfoTable } from "../contract";
import type { Language } from "../../i18n";
import { interpolate } from "../../i18n";
import { MODULE_TEXT, PATTERN_OVERRIDES } from "./overrides";

/**
 * Translate one module-generated source string for the active language. Exact matches win; then
 * pattern rules rewrite strings that embed runtime values. Unknown strings pass through unchanged,
 * so an untranslated module still renders (in English) instead of breaking.
 */
export function localizeString(text: string, language: Language): string {
  const exact = MODULE_TEXT[language];
  if (exact && text in exact) return exact[text];

  const patterns = PATTERN_OVERRIDES[language];
  if (patterns) {
    for (const rule of patterns) {
      const match = rule.source.exec(text);
      if (match) {
        const vars: Record<string, string> = {};
        match.slice(1).forEach((value, index) => {
          vars[String(index + 1)] = value;
        });
        return interpolate(rule.template, vars);
      }
    }
  }
  return text;
}

/** Translate every human-readable field of an info payload (titles, columns, notes, cell values). */
export function localizeInfo(payload: InfoPayload, language: Language): InfoPayload {
  return payload.map((table) => localizeTable(table, language));
}

function localizeTable(table: InfoTable, language: Language): InfoTable {
  return {
    ...table,
    title: localizeString(table.title, language),
    columns: table.columns.map((column) => localizeString(column, language)),
    note: table.note ? localizeString(table.note, language) : table.note,
    rows: table.rows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => localizeString(cell, language)),
    })),
  };
}
