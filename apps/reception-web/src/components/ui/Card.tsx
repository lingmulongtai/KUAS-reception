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
    <div className={clsx('glass-panel glass-outline flex flex-col gap-5 p-6', className)}>
      {(title || description || headerSlot) && (
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            {title ? <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3> : null}
            {description ? <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
          </div>
          {headerSlot}
        </div>
      )}
      {children}
      {footerSlot ? <div className="border-t border-white/40 pt-4 dark:border-white/10">{footerSlot}</div> : null}
    </div>
  )
}
