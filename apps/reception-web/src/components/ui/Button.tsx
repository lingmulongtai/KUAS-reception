import clsx from 'clsx'
import { LoaderCircle } from 'lucide-react'
import { type ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-br from-brand-500/90 to-sky-500/80 text-white shadow-lg shadow-brand-900/30 hover:from-brand-400/90 hover:to-sky-400/80',
  secondary:
    'bg-white/40 text-slate-700 shadow-md hover:bg-white/70 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-900/60',
  ghost: 'bg-transparent text-slate-600 hover:bg-white/40 dark:text-slate-300 dark:hover:bg-slate-900/40',
  danger:
    'bg-gradient-to-br from-rose-500/90 to-amber-500/80 text-white shadow-lg shadow-rose-900/30 hover:from-rose-400/90 hover:to-amber-400/80',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-60',
        'backdrop-blur-md',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : icon}
      <span>{children}</span>
    </button>
  )
}
