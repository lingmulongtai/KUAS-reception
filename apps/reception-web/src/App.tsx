import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { useThemeSync } from '@/hooks/useThemeSync'
import { supportedLocales } from '@/i18n'
import { Code2, Moon, Sun } from 'lucide-react'
import { ReceptionLanding } from './features/reception/components/ReceptionLanding'
import { ReceptionFlow } from './features/reception/components/ReceptionFlow'

const queryClient = new QueryClient()

type ModeSelection = 'reserved' | 'walkIn' | null

function ReceptionApp() {
  const { t, i18n } = useTranslation()
  const { toggleTheme } = useThemeSync()
  const [selectedMode, setSelectedMode] = useState<ModeSelection>(null)
  const [isDevMode, setIsDevMode] = useState(false)
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  )

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const handleThemeToggle = () => {
    toggleTheme()
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      const nextIsDark = root.classList.contains('dark')
      setIsDark(nextIsDark)
    }
  }

  const currentLocaleIndex = supportedLocales.findIndex((locale) => locale.code === i18n.language)
  const safeLocaleIndex = currentLocaleIndex >= 0 ? currentLocaleIndex : 0
  const currentLocale = supportedLocales[safeLocaleIndex]

  const handleLanguageToggle = () => {
    const nextLocale = supportedLocales[(safeLocaleIndex + 1) % supportedLocales.length]
    void i18n.changeLanguage(nextLocale.code)
  }

  const handleStartReserved = () => {
    setSelectedMode('reserved')
  }

  const handleStartWalkIn = () => {
    setSelectedMode('walkIn')
  }

  const handleCancelFlow = () => {
    setSelectedMode(null)
  }

  const handleCompleteFlow = () => {
    setSelectedMode(null)
  }

  const headerButtonClasses =
    'inline-flex h-10 items-center justify-center rounded-full border border-white/50 bg-white/60 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm transition hover:bg-white/80 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900/70'

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="pointer-events-none absolute -top-40 -right-32 h-80 w-80 gradient-orb opacity-50 blur-3xl dark:opacity-30" />
      <div className="pointer-events-none absolute -bottom-56 -left-16 h-[26rem] w-[26rem] gradient-orb opacity-60 blur-3xl dark:opacity-40" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 shadow-inner backdrop-blur dark:bg-slate-900/60">
              <img 
                src={isDark ? '/kuas_logo_w_trans.png' : '/kuas_logo.jpg'} 
                alt={t('home.header.logoAlt')} 
                className="h-9 w-9 object-contain rounded-lg" 
              />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                {t('home.header.title')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('home.header.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleThemeToggle}
              className={headerButtonClasses}
              aria-label={isDark ? t('home.header.switchToLight') : t('home.header.switchToDark')}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={handleLanguageToggle}
              className={headerButtonClasses}
              aria-label={t('home.header.languageToggle')}
              title={t(currentLocale.labelKey)}
            >
              {currentLocale.code.toUpperCase()}
            </button>
            <button
              type="button"
              onClick={() => setIsDevMode((prev) => !prev)}
              className={clsx(
                headerButtonClasses,
                'gap-2 px-4',
                isDevMode &&
                'border-brand-400/70 bg-brand-100/80 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/20 dark:text-brand-100'
              )}
              aria-pressed={isDevMode}
              aria-label={t('home.header.devMode')}
            >
              <Code2 className="h-4 w-4" />
              <span>{t('home.header.devMode')}</span>
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-6 pb-10">
          <div className="w-full max-w-5xl">
            {selectedMode ? (
              <ReceptionFlow
                mode={selectedMode}
                onCancel={handleCancelFlow}
                onComplete={handleCompleteFlow}
              />
            ) : (
              <ReceptionLanding
                onStartReserved={handleStartReserved}
                onStartWalkIn={handleStartWalkIn}
              />
            )}
          </div>
        </main>

        {/* 開発者モードパネル */}
        {isDevMode && (
          <div className="fixed bottom-4 right-4 z-50 w-80 rounded-2xl border border-brand-200 bg-white/95 p-4 shadow-xl backdrop-blur dark:border-brand-800 dark:bg-slate-900/95">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-brand-700 dark:text-brand-300">
                {t('home.devPanel.title')}
              </h3>
              <button
                type="button"
                onClick={() => setIsDevMode(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              {t('home.devPanel.description')}
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t('home.devPanel.selectedMode')}</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {selectedMode ? t(`modes.${selectedMode}`) : t('home.devPanel.none')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Theme</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {isDark ? 'Dark' : 'Light'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Language</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {currentLocale.code.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Environment</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {import.meta.env.DEV ? 'Development' : 'Production'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReceptionApp />
    </QueryClientProvider>
  )
}

export default App
