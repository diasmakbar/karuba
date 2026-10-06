import { LANGUAGES } from "../lib/i18n";
import { useLanguage } from "../contexts/languageContext";

/**
 * Per-device language switcher. Available on the landing, the lobby and the in-game HUD so a
 * player can change language at any time, including while the game is running.
 */
export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      {LANGUAGES.map((option) => (
        <button
          key={option.code}
          type="button"
          className={`lang-option ${language === option.code ? "is-active" : ""}`}
          aria-pressed={language === option.code}
          onClick={() => setLanguage(option.code)}
        >
          {option.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
