import { createContext, useContext, useState, ReactNode } from 'react';
import langData from '../lang.json';

type Language = 'en' | 'id';

interface LangContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LangContext = createContext<LangContextType | undefined>(undefined);

export const useLang = () => {
  const context = useContext(LangContext);
  if (!context) {
    throw new Error('useLang must be used within a LangProvider');
  }
  return context;
};

interface LangProviderProps {
  children: ReactNode;
}

export const LangProvider = ({ children }: LangProviderProps) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = langData[language];

    for (const k of keys) {
      value = value?.[k];
    }

    return value || key; // fallback to key if not found
  };

  return (
    <LangContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LangContext.Provider>
  );
};
