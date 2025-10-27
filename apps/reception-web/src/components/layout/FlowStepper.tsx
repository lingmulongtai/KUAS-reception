import { type LucideIcon } from 'lucide-react'
import clsx from 'clsx'

interface FlowStepperMetric {
  label: string
  value: string
  subtle?: boolean
}

export interface FlowStepperItem {
  id: string
  title: string
  description: string
  icon: LucideIcon
  meta?: string
}

interface FlowStepperProps {
  items: FlowStepperItem[]
  activeId: string
  accentColor?: string
  ctaLabel?: string
  onCtaClick?: () => void
  metrics?: FlowStepperMetric[]
  title?: string
  subtitle?: string
}

export function FlowStepper({
  items,
  activeId,
  accentColor = '#D7DADD',
  ctaLabel,
  onCtaClick,
  metrics,
  title = 'Flow hierarchy',
  subtitle = 'Reception journey',
}: FlowStepperProps) {
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeId)
  )

  return (
    <aside className="glass-panel glass-outline flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500/80 dark:text-slate-400/80">
              {title}
            </p>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {subtitle}
            </h2>
          </div>
          {ctaLabel ? (
            <button
              type="button"
              onClick={onCtaClick}
              className="relative inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/40 px-5 py-2 text-sm font-semibold text-slate-700 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] backdrop-blur transition hover:bg-white/70 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900/80"
              style={{
                boxShadow:
                  '0 8px 18px -6px rgba(15, 23, 42, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.35)',
                backgroundImage: `linear-gradient(135deg, ${accentColor} 0%, rgba(255, 255, 255, 0.85) 100%)`,
              }}
            >
              {ctaLabel}
            </button>
          ) : null}
        </div>

        {metrics?.length ? (
          <dl className="grid w-full gap-3 rounded-3xl border border-white/40 bg-white/35 p-4 text-xs dark:border-white/10 dark:bg-slate-900/40">
            {metrics.map((metric) => (
              <div key={metric.label} className="flex items-baseline justify-between gap-3">
                <dt className="font-semibold uppercase tracking-[0.18em] text-slate-500/80 dark:text-slate-400/80">
                  {metric.label}
                </dt>
                <dd
                  className={clsx(
                    'text-sm font-medium text-slate-700 dark:text-slate-200',
                    metric.subtle && 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      <ul className="flex flex-col gap-3">
        {items.map((item, index) => {
          const status = index < activeIndex ? 'complete' : index === activeIndex ? 'current' : 'upcoming'
          const isCurrent = status === 'current'
          const isComplete = status === 'complete'

          return (
            <li
              key={item.id}
              className={clsx(
                'group relative flex gap-3 rounded-3xl border border-white/40 px-4 py-4 transition dark:border-white/10',
                'bg-white/25 text-slate-600 shadow-[0_10px_25px_-12px_rgba(15,23,42,0.2)] backdrop-blur lg:px-5 lg:py-5',
                isCurrent && 'border-transparent bg-white/70 shadow-[0_18px_35px_-20px_rgba(15,23,42,0.4)] dark:bg-slate-900/70',
                isComplete && 'bg-white/40 dark:bg-slate-900/40'
              )}
              style={
                isCurrent
                  ? {
                      backgroundImage: `linear-gradient(135deg, ${accentColor} 0%, rgba(255, 255, 255, 0.92) 100%)`,
                    }
                  : undefined
              }
            >
              <div className="mt-1 flex flex-col items-center">
                <span
                  className={clsx(
                    'flex h-11 w-11 items-center justify-center rounded-2xl border border-white/60 bg-white/60 text-slate-700 shadow-inner transition dark:border-white/5 dark:bg-slate-900/60 dark:text-slate-200',
                    isCurrent && 'border-transparent bg-white text-slate-900 dark:bg-slate-100 dark:text-slate-900',
                    isComplete && 'bg-white/70 text-slate-700 dark:bg-slate-900/60 dark:text-slate-100'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                </span>
                {index < items.length - 1 ? (
                  <span className="mt-3 h-[34px] w-px flex-1 bg-gradient-to-b from-white/60 to-transparent dark:from-white/10" />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p
                    className={clsx(
                      'text-sm font-semibold text-slate-700 transition dark:text-slate-200',
                      isCurrent && 'text-slate-900 dark:text-white',
                      isComplete && 'text-slate-600 dark:text-slate-300'
                    )}
                  >
                    {item.title}
                  </p>
                  {item.meta ? (
                    <span className="rounded-full border border-white/40 bg-white/50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-300">
                      {item.meta}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-slate-500/90 dark:text-slate-400/80">{item.description}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
