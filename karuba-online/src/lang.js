// Language utilities
const DEFAULT_LANGUAGE = 'id'

let currentLanguage = DEFAULT_LANGUAGE
let translations = {}

/**
 * Load language translations from JSON file
 * @param {Object} langData - Language data object
 */
export function loadTranslations(langData) {
  translations = langData
}

/**
 * Get translation for a key path
 * @param {string} key - Dot-notation key (e.g., "game.buttons.startGame")
 * @param {Object} params - Parameters for string interpolation
 * @returns {string} Translated string
 */
export function t(key, params = {}) {
  const keys = key.split('.')
  let value = translations[currentLanguage] || translations[DEFAULT_LANGUAGE] || {}

  for (const k of keys) {
    value = value?.[k]
    if (value === undefined) break
  }

  if (typeof value !== 'string') {
    // Fallback to default language if key not found in current language
    value = translations[DEFAULT_LANGUAGE] || {}
    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) break
    }

    // Return key itself if no translation found
    if (typeof value !== 'string') {
      console.warn(`Translation missing for key: ${key}`)
      return key
    }
  }

  // String interpolation
  let result = value
  Object.entries(params).forEach(([param, val]) => {
    result = result.replace(`$${param}`, val)
  })

  return result
}

/**
 * Set current language
 * @param {string} lang - Language code (e.g., 'id', 'en')
 */
export function setLanguage(lang) {
  currentLanguage = lang
}

/**
 * Get current language
 * @returns {string} Current language code
 */
export function getLanguage() {
  return currentLanguage
}

/**
 * Get available languages
 * @returns {string[]} Array of available language codes
 */
export function getAvailableLanguages() {
  return Object.keys(translations)
}
