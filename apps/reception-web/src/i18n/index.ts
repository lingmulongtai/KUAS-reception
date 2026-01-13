import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import ja from './locales/ja.json'
import en from './locales/en.json'

type LocaleKey = 'ja' | 'en'

export const supportedLocales: Array<{ code: LocaleKey; labelKey: string }> = [
  { code: 'ja', labelKey: 'languages.ja' },
  { code: 'en', labelKey: 'languages.en' },
]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ja: { translation: ja },
      en: { translation: en },
    },
    fallbackLng: 'ja',
    supportedLngs: supportedLocales.map((locale) => locale.code),
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  })

export default i18n
