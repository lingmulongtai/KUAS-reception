import clsx from 'clsx'

const variants = {
  subtle: 'bg-white/60 text-slate-700 dark:bg-slate-900/40 dark:text-slate-200',
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200',
  success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200',
  danger: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
}

export interface BadgeProps {
  children: React.ReactNode
  variant?: keyof typeof variants
}

export function Badge({ children, variant = 'subtle' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide shadow-sm backdrop-blur',
        variants[variant]
      )}
    >
      {children}
    </span>
  )
}
