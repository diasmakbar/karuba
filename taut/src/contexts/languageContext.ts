import { createContext, useContext } from "react";
import { DEFAULT_LANGUAGE, getMessages, type Language, type Messages } from "../lib/i18n";

export interface LanguageValue {
  /** Active language code. */
  language: Language;
  /** Switch the language (persisted per device). */
  setLanguage: (language: Language) => void;
  /** The active dictionary. */
  messages: Messages;
}

export const STORAGE_KEY = "taut.lang";

export const LanguageContext = createContext<LanguageValue>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => undefined,
  messages: getMessages(DEFAULT_LANGUAGE),
});

/** Access the active language and its dictionary. Safe to call in any component under the provider. */
export function useLanguage(): LanguageValue {
  return useContext(LanguageContext);
}
