import clsx from 'clsx'
import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface GlassFieldProps {
  label: string
  description?: string
  hint?: string
  required?: boolean
  error?: string
  children: ReactNode
  orientation?: 'vertical' | 'horizontal'
  className?: string
}

export function GlassField({
  label,
  description,
  hint,
  required,
  error,
  children,
  orientation = 'vertical',
  className,
}: GlassFieldProps) {
  const { t } = useTranslation()

  return (
    <div
      className={clsx(
        'glass-panel glass-outline flex gap-5 rounded-3xl p-5 transition-all whitespace-normal break-words',
        orientation === 'horizontal' ? 'flex-col md:flex-row md:items-center md:justify-between' : 'flex-col',
        error ? 'ring-1 ring-rose-400/70 dark:ring-rose-500/40' : '',
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 break-words dark:text-slate-400">
            {label}
          </span>
          {required ? (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:bg-rose-500/20 dark:text-rose-200">
              {t('common.labels.required')}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="text-sm text-slate-500 break-words dark:text-slate-400">{description}</p>
        ) : null}
        {hint ? <p className="text-xs text-slate-400 break-words dark:text-slate-500">{hint}</p> : null}
        {error ? (
          <p className="text-xs font-semibold text-rose-500 break-words dark:text-rose-300">{error}</p>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 break-words">{children}</div>
    </div>
  )
}
