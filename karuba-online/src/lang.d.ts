declare module './lang.json' {
  const value: any;
  export default value;
}

declare module './lang.js' {
  export function loadTranslations(langData: any): void;
  export function t(key: string, params?: Record<string, any>): string;
  export function setLanguage(lang: string): void;
  export function getLanguage(): string;
  export function getAvailableLanguages(): string[];
}
