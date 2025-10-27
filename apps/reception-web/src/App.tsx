import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import clsx from 'clsx'
import { Badge, Button, Card } from '@/components/ui'
import { useTranslation } from 'react-i18next'
import { useThemeSync } from '@/hooks/useThemeSync'
import { supportedLocales } from '@/i18n'
import { CalendarCheck2, Code2, ListChecks, Moon, Sparkles, Sun, UserPlus2 } from 'lucide-react'

const queryClient = new QueryClient()

type ModeSelection = 'reserved' | 'walkIn' | null
type InfoPanel = 'programs' | 'capstone' | null

function ReceptionApp() {
  const { t, i18n } = useTranslation()
  const { toggleTheme } = useThemeSync()
  const [selectedMode, setSelectedMode] = useState<ModeSelection>(null)
  const [activeInfo, setActiveInfo] = useState<InfoPanel>(null)
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

  const handleModeSelection = (mode: ModeSelection) => {
    setSelectedMode(mode)
    setActiveInfo(null)
  }

  const handleProgramsClick = () => {
    setActiveInfo((prev) => (prev === 'programs' ? null : 'programs'))
  }

  const handleCapstoneClick = () => {
    setActiveInfo((prev) => (prev === 'capstone' ? null : 'capstone'))
  }

  const infoContent = activeInfo
    ? {
        title: t(`home.info.${activeInfo}.title`),
        description: t(`home.info.${activeInfo}.description`),
        points: t(`home.info.${activeInfo}.points`, { returnObjects: true }) as string[],
      }
    : null

  const modeLabel = selectedMode ? t(`home.selection.${selectedMode}`) : null

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
              <img src="/kuas_logo_w_trans.png" alt={t('home.header.logoAlt')} className="h-9 w-9 object-contain" />
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
          <div className="w-full max-w-3xl">
            <div className="glass-panel glass-outline flex flex-col gap-8 px-8 py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <Badge variant="brand">{t('home.badge')}</Badge>
                <h1 className="text-3xl font-semibold text-slate-900 dark:text-white md:text-4xl">{t('home.title')}</h1>
                <p className="max-w-2xl text-base text-slate-600 dark:text-slate-300">{t('home.description')}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Button
                  size="lg"
                  className={clsx(
                    'h-24 justify-between px-8 text-xl',
                    selectedMode === 'reserved' && 'ring-4 ring-brand-400/60 dark:ring-brand-500/50'
                  )}
                  icon={<CalendarCheck2 className="h-6 w-6" />}
                  onClick={() => handleModeSelection('reserved')}
                >
                  {t('home.buttons.reserved')}
                </Button>
                <Button
                  size="lg"
                  className={clsx(
                    'h-24 justify-between px-8 text-xl',
                    selectedMode === 'walkIn' && 'ring-4 ring-emerald-400/60 dark:ring-emerald-500/50'
                  )}
                  icon={<UserPlus2 className="h-6 w-6" />}
                  onClick={() => handleModeSelection('walkIn')}
                >
                  {t('home.buttons.walkIn')}
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant={activeInfo === 'programs' ? 'primary' : 'secondary'}
                  size="md"
                  icon={<ListChecks className="h-4 w-4" />}
                  onClick={handleProgramsClick}
                >
                  {t('home.secondary.programs')}
                </Button>
                <Button
                  variant={activeInfo === 'capstone' ? 'primary' : 'secondary'}
                  size="md"
                  icon={<Sparkles className="h-4 w-4" />}
                  onClick={handleCapstoneClick}
                >
                  {t('home.secondary.capstone')}
                </Button>
              </div>

              {modeLabel ? (
                <div className="flex justify-center">
                  <Badge variant="subtle">{modeLabel}</Badge>
                </div>
              ) : null}

              {infoContent ? (
                <Card title={infoContent.title} description={infoContent.description}>
                  <ul className="ml-5 list-disc space-y-2 text-left text-sm text-slate-600 dark:text-slate-300">
                    {infoContent.points.map((point, index) => (
                      <li key={`${activeInfo}-${index}`}>{point}</li>
                    ))}
                  </ul>
                </Card>
              ) : null}

              {isDevMode ? (
                <Card
                  className="border border-dashed border-white/50 dark:border-white/20"
                  title={t('home.devPanel.title')}
                  description={t('home.devPanel.description')}
                >
                  <dl className="grid gap-2 text-left text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        {t('home.devPanel.selectedMode')}
                      </dt>
                      <dd>{modeLabel ?? t('home.devPanel.none')}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        {t('home.devPanel.activeInfo')}
                      </dt>
                      <dd>{activeInfo ? t(`home.devPanel.${activeInfo}`) : t('home.devPanel.none')}</dd>
                    </div>
                  </dl>
                </Card>
              ) : null}
            </div>
          </div>
        </main>
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
