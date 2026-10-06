import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LANGUAGE, getMessages, isLanguage, type Language } from "../lib/i18n";
import { LanguageContext, STORAGE_KEY, type LanguageValue } from "./languageContext";

function readStoredLanguage(): Language {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isLanguage(stored) ? stored : DEFAULT_LANGUAGE;
}

/**
 * Holds the active language for this device. Each player picks their own language; it is persisted
 * to `localStorage` so it survives refreshes and applies everywhere, including mid-game.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => readStoredLanguage());

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  // Keep the document language in sync (initial load + whenever it changes).
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageValue>(
    () => ({ language, setLanguage, messages: getMessages(language) }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
