import clsx from 'clsx'
import { type ReactNode } from 'react'

interface GlassFieldProps {
  label: string
  description?: string
  hint?: string
  required?: boolean
  error?: string
  children: ReactNode
  className?: string
}

export function GlassField({
  label,
  description,
  hint,
  required,
  error,
  children,
  className,
}: GlassFieldProps) {
  return (
    <div className={clsx('space-y-3', className)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
          {description && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
        {hint && (
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded dark:bg-slate-800 dark:text-slate-400">
            {hint}
          </span>
        )}
      </div>

      <div
        className={clsx(
          "rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950",
          error ? 'border-red-300 ring-2 ring-red-100 dark:border-red-800 dark:ring-red-900/30' : ''
        )}
      >
        <div className="p-4">
          {children}
        </div>
      </div>

      {error && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400 animate-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  )
}
