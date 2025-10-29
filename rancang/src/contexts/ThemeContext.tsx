import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<Theme>('dark');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      <div style={{
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#000000',
        minHeight: '100vh',
        transition: 'background-color 0.3s ease, color 0.3s ease'
      }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
