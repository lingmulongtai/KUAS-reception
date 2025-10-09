import { type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { supportedLocales } from '@/i18n'

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()

  const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLanguage = event.target.value
    void i18n.changeLanguage(nextLanguage)
  }

  const resolvedLocale =
    supportedLocales.find((locale) => locale.code === i18n.language) ??
    supportedLocales.find((locale) => i18n.language?.startsWith(locale.code)) ??
    supportedLocales.find((locale) => locale.code === i18n.resolvedLanguage) ??
    supportedLocales.find((locale) => i18n.resolvedLanguage?.startsWith(locale.code)) ??
    supportedLocales[0]

  const currentLanguage = resolvedLocale.code

  return (
    <label className="glass-panel glass-outline inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">
      <Globe className="h-4 w-4 text-slate-500 dark:text-slate-300" aria-hidden="true" />
      <span className="uppercase tracking-wide">
        {t('layout.languageToggle')}
      </span>
      <select
        value={currentLanguage}
        onChange={handleLanguageChange}
        className="rounded-full border border-white/30 bg-white/60 px-3 py-1 text-xs font-semibold text-slate-700 outline-none transition hover:border-white/60 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200"
        aria-label={t('layout.languageToggle')}
      >
        {supportedLocales.map((locale) => (
          <option key={locale.code} value={locale.code}>
            {t(locale.labelKey)}
          </option>
        ))}
      </select>
    </label>
  )
}
