import { type ReactNode } from 'react'
import { clsx } from 'clsx'

export interface SidebarNavItem {
  label: string
  icon?: ReactNode
  active?: boolean
  badge?: string
  onClick?: () => void
}

export interface SidebarNavSection {
  title: string
  items: SidebarNavItem[]
}

interface SidebarNavProps {
  sections: SidebarNavSection[]
}

export function SidebarNav({ sections }: SidebarNavProps) {
  return (
    <nav className="flex flex-1 flex-col gap-4 whitespace-normal break-words">
      {sections.map((section) => (
        <div key={section.title} className="flex flex-col gap-2">
          <h3 className="px-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500/80 break-words dark:text-slate-400/80">
            {section.title}
          </h3>
          <div className="flex flex-col gap-1">
            {section.items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className={clsx(
                  'group inline-flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm font-medium transition text-left whitespace-normal break-words',
                  'bg-white/20 text-slate-600 hover:bg-white/45 hover:shadow-md dark:bg-slate-900/20 dark:text-slate-300 dark:hover:bg-slate-900/40',
                  item.active &&
                    'bg-white/60 text-slate-900 shadow-lg dark:bg-slate-900/70 dark:text-white dark:shadow-brand-900/30'
                )}
              >
                <span className="inline-flex min-w-0 max-w-full flex-1 items-center gap-2">
                  <span className="flex-shrink-0 opacity-80 transition group-hover:opacity-100">{item.icon}</span>
                  <span className="min-w-0 break-words">{item.label}</span>
                </span>
                {item.badge ? (
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700 break-words">{item.badge}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}
