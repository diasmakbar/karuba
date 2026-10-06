import { useCallback } from "react";
import { useLanguage } from "../../contexts/languageContext";
import { interpolate, lookup } from "./index";

/**
 * Returns a translator bound to the active language: `t("lobby.start")` or
 * `t("room.infoFrom", { a, b })`. Falls back to the key itself when a string is missing.
 */
export function useT(): (key: string, vars?: Record<string, string | number>) => string {
  const { messages } = useLanguage();
  return useCallback(
    (key: string, vars?: Record<string, string | number>) => interpolate(lookup(messages, key), vars),
    [messages],
  );
}
