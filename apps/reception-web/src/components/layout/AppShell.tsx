import { type ReactNode, useState } from 'react'
import { Menu, Moon, Sun } from 'lucide-react'
import clsx from 'clsx'
import { useThemeSync } from '@/hooks/useThemeSync'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useTranslation } from 'react-i18next'

interface AppShellProps {
  header?: ReactNode
  sidebar?: ReactNode
  children: ReactNode
}

export function AppShell({ header, sidebar, children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const { setTheme } = useThemeSync()
  const { t } = useTranslation()

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100"
      style={{
        backgroundImage: `linear-gradient(var(--app-bg-overlay-start), var(--app-bg-overlay-end)), url('/opencampus-img01.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute -top-40 -right-32 h-96 w-96 gradient-orb blur-3xl opacity-60 dark:opacity-40 pointer-events-none" />
      <div className="absolute -bottom-52 -left-12 h-[28rem] w-[28rem] gradient-orb blur-3xl opacity-55 dark:opacity-35 pointer-events-none" />

      <div className="relative z-10 flex min-h-screen">
        {sidebar ? (
          <aside
            className={clsx(
              'glass-panel glass-outline relative hidden w-72 flex-col border-transparent p-6 transition-all duration-300 whitespace-normal break-words lg:flex',
              isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
            )}
          >
            {sidebar}
          </aside>
        ) : null}

        <main className="relative flex flex-1 flex-col gap-6 p-6 whitespace-normal break-words lg:p-10">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {sidebar ? (
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/40 shadow-sm backdrop-blur transition hover:bg-white/70 dark:border-white/10 dark:bg-slate-900/60 dark:hover:bg-slate-900/80 lg:hidden"
                  onClick={() => setIsSidebarOpen((prev) => !prev)}
                >
                  <Menu className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                </button>
              ) : null}
              <div className="glass-panel glass-outline flex items-center gap-3 px-4 py-2">
                <img
                  src="/kuas_logo_w_trans.png"
                  alt={t('layout.brand.title')}
                  className="h-10 w-auto"
                  draggable={false}
                />
                <div className="hidden lg:flex lg:flex-col">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200">
                    {t('layout.brand.title')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('layout.brand.subtitle')}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="glass-panel glass-outline flex items-center gap-2 rounded-full px-2 py-1 whitespace-normal break-words">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/60 dark:hover:bg-slate-900/70"
                  onClick={() => setTheme('light')}
                  aria-label={t('layout.themeToggleLight')}
                >
                  <Sun className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                </button>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t('layout.modeToggle')}
                </div>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/60 dark:hover:bg-slate-900/70"
                  onClick={() => setTheme('dark')}
                  aria-label={t('layout.themeToggleDark')}
                >
                  <Moon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                </button>
              </div>
              <LanguageSwitcher />
            </div>
          </header>

          {header ? <div className="glass-panel glass-outline whitespace-normal break-words p-6 shadow-lg">{header}</div> : null}

          <div className="flex flex-1 flex-col gap-6 lg:flex-row">
            {sidebar ? (
              <aside
                className={clsx(
                  'glass-panel glass-outline fixed inset-y-0 left-0 z-20 w-72 border-transparent p-6 transition-all duration-300 whitespace-normal break-words lg:hidden',
                  isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
                )}
              >
                {sidebar}
              </aside>
            ) : null}

            <section className="glass-panel glass-outline flex-1 p-6 whitespace-normal break-words lg:p-10">
              <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">{children}</div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
