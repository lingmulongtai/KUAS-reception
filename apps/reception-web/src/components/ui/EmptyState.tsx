import { type LucideIcon } from 'lucide-react'
import clsx from 'clsx'

interface EmptyStateProps {
  title: string
  description: string
  icon: LucideIcon
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, icon: Icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'glass-panel glass-outline flex flex-col items-center gap-4 px-8 py-12 text-center shadow-md',
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/60 shadow-inner dark:bg-slate-900/60">
        <Icon className="h-6 w-6 text-brand-500" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {action}
    </div>
  )
}
