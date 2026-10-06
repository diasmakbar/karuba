import { en, type Messages } from "./en";
import { id } from "./id";

/** Language codes supported by the app. Add a code here + a matching file to add a language. */
export type Language = "en" | "id";

/** Every supported language, with its native display name (used by the language switcher). */
export const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "id", label: "Bahasa Indonesia" },
];

/** All locale dictionaries keyed by language code. */
export const LOCALES: Record<Language, Messages> = { en, id };

export const DEFAULT_LANGUAGE: Language = "en";

/** True when `value` is a supported language code. */
export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && value in LOCALES;
}

/** The dictionary for a language (falls back to English if an unknown code slips through). */
export function getMessages(language: Language): Messages {
  return LOCALES[language] ?? en;
}

/**
 * Interpolate `{token}` placeholders in a message. Unknown tokens are left untouched so a
 * missing value is visible in the UI rather than silently dropped.
 */
export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

/**
 * Dotted-key lookup into a `Messages` object (e.g. `"lobby.start"`). Returns the template string
 * for the given key, or the key itself if it is missing.
 */
export function lookup(messages: Messages, key: string): string {
  const parts = key.split(".");
  let node: unknown = messages;
  for (const part of parts) {
    if (typeof node !== "object" || node === null) return key;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : key;
}

export type { Messages } from "./en";
