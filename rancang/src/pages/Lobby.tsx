import { useState } from "react";
import { getPlayerId } from "../lib/playerId";
import { useLang } from "../contexts/LangContext";
import { useTheme } from "../contexts/ThemeContext";
import LobbyGameStep from "./LobbyGameStep";
import LobbyNameStep from "./LobbyNameStep";

export default function Lobby() {
  const [step, setStep] = useState<"game" | "name">("game");
  const [gameId, setGameId] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"classic" | "balanced">("balanced");
  const [includeAdvanced, setIncludeAdvanced] = useState(false);
  const playerId = getPlayerId(name);
  const { language, setLanguage } = useLang();
  const { theme, toggleTheme } = useTheme();

  return (
    <main className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div className="page-inner" style={{
        width: 360,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        {/* Controls */}
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          display: 'flex',
          gap: 4
        }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid #ccc',
              background: theme === 'dark' ? '#333' : '#fff',
              color: theme === 'dark' ? '#fff' : '#000',
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Language Selector */}
          <button
            onClick={() => setLanguage('en')}
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              border: language === 'en' ? '2px solid #007bff' : '1px solid #ccc',
              background: theme === 'dark' ? (language === 'en' ? '#1a4f7a' : '#333') : (language === 'en' ? '#e7f3ff' : '#fff'),
              color: theme === 'dark' ? '#fff' : '#000',
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('id')}
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              border: language === 'id' ? '2px solid #007bff' : '1px solid #ccc',
              background: theme === 'dark' ? (language === 'id' ? '#1a4f7a' : '#333') : (language === 'id' ? '#e7f3ff' : '#fff'),
              color: theme === 'dark' ? '#fff' : '#000',
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            ID
          </button>
        </div>

        <div className="card" style={{
          padding: 24,
          borderRadius: 12,
          border: theme === 'dark' ? '2px solid #ffffff' : '1px solid #dee2e6',
          backgroundColor: theme === 'dark' ? 'transparent' : '#ffffff',
          color: theme === 'dark' ? '#ffffff' : '#000000',
          boxShadow: theme === 'dark' ? '0 4px 12px rgba(255,255,255,0.1)' : '0 4px 12px rgba(0,0,0,0.15)',
          width: "100%"
        }}>
          {step === "game" && (
            <LobbyGameStep
              gameId={gameId}
              setGameId={setGameId}
              setStep={setStep}
              mode={mode}
              setMode={setMode}
              includeAdvanced={includeAdvanced}
              setIncludeAdvanced={setIncludeAdvanced}
            />
          )}

          {step === "name" && (
            <LobbyNameStep
              gameId={gameId}
              name={name}
              setName={setName}
              playerId={playerId}
              mode={mode}
              includeAdvanced={includeAdvanced}
            />
          )}
        </div>
      </div>
    </main>
  );
}
