import clsx from 'clsx'

interface CardProps {
  title?: string
  description?: string
  children?: React.ReactNode
  className?: string
  headerSlot?: React.ReactNode
  footerSlot?: React.ReactNode
}

export function Card({ title, description, children, className, headerSlot, footerSlot }: CardProps) {
  return (
    <div className={clsx('glass-panel glass-outline flex flex-col gap-5 p-6 whitespace-normal break-words', className)}>
      {(title || description || headerSlot) && (
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1 break-words">
            {title ? (
              <h3 className="text-lg font-semibold text-slate-800 break-words dark:text-slate-100">{title}</h3>
            ) : null}
            {description ? (
              <p className="text-sm text-slate-500 break-words dark:text-slate-400">{description}</p>
            ) : null}
          </div>
          {headerSlot ? <div className="flex-shrink-0 break-words">{headerSlot}</div> : null}
        </div>
      )}
      <div className="min-w-0 break-words">{children}</div>
      {footerSlot ? (
        <div className="border-t border-white/40 pt-4 dark:border-white/10">
          <div className="min-w-0 break-words">{footerSlot}</div>
        </div>
      ) : null}
    </div>
  )
}
