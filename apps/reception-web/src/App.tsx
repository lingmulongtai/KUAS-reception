import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { useThemeSync } from '@/hooks/useThemeSync'
import { supportedLocales } from '@/i18n'
import { Shield, Moon, Sun } from 'lucide-react'
import { ReceptionLanding } from './features/reception/components/ReceptionLanding'
import { ReceptionFlow } from './features/reception/components/ReceptionFlow'
import { AdminLoginModal, AdminPanel } from './features/admin/components'
import { useAdmin } from './features/admin/hooks/useAdmin'

const queryClient = new QueryClient()

type ModeSelection = 'reserved' | 'walkIn' | null

function ReceptionApp() {
  const { t, i18n } = useTranslation()
  const { toggleTheme } = useThemeSync()
  const { isAuthenticated } = useAdmin()
  const [selectedMode, setSelectedMode] = useState<ModeSelection>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  )
  const [themeTransition, setThemeTransition] = useState<'to-dark' | 'to-light' | null>(null)
  const [langPhase, setLangPhase] = useState<'idle' | 'out' | 'in'>('idle')

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const handleAdminClick = () => {
    if (isAuthenticated) {
      setShowAdminPanel(true)
    } else {
      setShowLoginModal(true)
    }
  }

  const handleLoginSuccess = () => {
    setShowAdminPanel(true)
  }

  const handleThemeToggle = () => {
    const willBeDark = !isDark
    setThemeTransition(willBeDark ? 'to-dark' : 'to-light')
    
    // Start the theme change at the peak of animation
    setTimeout(() => {
      toggleTheme()
      if (typeof document !== 'undefined') {
        const root = document.documentElement
        const nextIsDark = root.classList.contains('dark')
        setIsDark(nextIsDark)
      }
    }, 250)
    
    // Remove overlay after animation completes
    setTimeout(() => {
      setThemeTransition(null)
    }, 800)
  }

  const currentLocaleIndex = supportedLocales.findIndex((locale) => locale.code === i18n.language)
  const safeLocaleIndex = currentLocaleIndex >= 0 ? currentLocaleIndex : 0
  const currentLocale = supportedLocales[safeLocaleIndex]

  const handleLanguageToggle = () => {
    // Phase 1: Fade out current text
    setLangPhase('out')
    
    // Phase 2: Change language and fade in
    setTimeout(() => {
      const nextLocale = supportedLocales[(safeLocaleIndex + 1) % supportedLocales.length]
      void i18n.changeLanguage(nextLocale.code)
      setLangPhase('in')
      
      // Phase 3: Return to idle
      setTimeout(() => setLangPhase('idle'), 400)
    }, 280)
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
    <div className={clsx(
      "relative min-h-screen overflow-hidden text-slate-900 transition-colors dark:text-slate-100",
      langPhase === 'out' && "lang-transition-out",
      langPhase === 'in' && "lang-transition-in"
    )}>
      {/* Theme transition overlay */}
      {themeTransition && (
        <div className={`theme-transition-overlay ${themeTransition}`} />
      )}
      <div className="pointer-events-none absolute -top-40 -right-32 h-80 w-80 gradient-orb opacity-50 blur-3xl dark:opacity-30" />
      <div className="pointer-events-none absolute -bottom-56 -left-16 h-[26rem] w-[26rem] gradient-orb opacity-60 blur-3xl dark:opacity-40" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-6">
          <button
            type="button"
            onClick={handleCancelFlow}
            className="flex items-center gap-3 rounded-2xl p-2 -m-2 transition-all hover:bg-white/50 dark:hover:bg-slate-800/50 cursor-pointer"
            aria-label={t('receptionFlow.restart', 'ホームに戻る')}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 shadow-inner backdrop-blur dark:bg-slate-900/60">
              <img 
                src={isDark ? '/kuas_logo_w_trans.png' : '/kuas_logo.jpg'} 
                alt={t('home.header.logoAlt')} 
                className="h-9 w-9 object-contain rounded-lg" 
              />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                {t('home.header.title')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('home.header.subtitle')}</p>
            </div>
          </button>
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
              onClick={handleAdminClick}
              className={clsx(
                headerButtonClasses,
                'gap-2 px-4',
                isAuthenticated &&
                'border-brand-400/70 bg-brand-100/80 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/20 dark:text-brand-100'
              )}
              aria-label={t('home.header.adminMode', '管理モード')}
            >
              <Shield className="h-4 w-4" />
              <span>{t('home.header.adminMode', '管理')}</span>
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

        {/* 管理者ログインモーダル */}
        <AdminLoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />

        {/* 管理パネル */}
        <AdminPanel
          isOpen={showAdminPanel}
          onClose={() => setShowAdminPanel(false)}
        />
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
