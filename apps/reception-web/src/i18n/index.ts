import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import ja from './locales/ja.json'
import en from './locales/en.json'
import id from './locales/id.json'

type LocaleKey = 'ja' | 'en' | 'id'

export const supportedLocales: Array<{ code: LocaleKey; labelKey: string }> = [
  { code: 'ja', labelKey: 'languages.ja' },
  { code: 'en', labelKey: 'languages.en' },
  { code: 'id', labelKey: 'languages.id' },
]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ja: { translation: ja },
      en: { translation: en },
      id: { translation: id },
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
