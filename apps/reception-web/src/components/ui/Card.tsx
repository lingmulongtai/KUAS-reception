import clsx from 'clsx'

interface CardProps {
  title?: string
  description?: string
  children?: React.ReactNode
  className?: string
  headerSlot?: React.ReactNode
  footerSlot?: React.ReactNode
}

export function Card({
  title,
  description,
  children,
  className,
  headerSlot,
  footerSlot,
}: CardProps) {
  return (
    <div
      className={clsx(
        'overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-900/5 transition-all dark:bg-slate-900 dark:ring-slate-50/10',
        className
      )}
    >
      <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/50">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            {title && (
              <h3 className="text-lg font-semibold leading-6 text-slate-900 dark:text-white">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
          {headerSlot && <div className="flex-shrink-0">{headerSlot}</div>}
        </div>
      </div>
      <div className="p-6">{children}</div>
      {footerSlot && (
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/50">
          {footerSlot}
        </div>
      )}
    </div>
  )
}
