import clsx from 'clsx'
import { Check } from 'lucide-react'

export interface Step {
  id: string
  label: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: string
  completedSteps?: string[]
}

export function StepIndicator({ steps, currentStep, completedSteps = [] }: StepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep)

  return (
    <div className="w-full">
      {/* デスクトップ表示 */}
      <div className="hidden sm:flex items-center justify-center gap-0">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id) || index < currentIndex
          const isCurrent = step.id === currentStep
          const isLast = index === steps.length - 1

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={clsx(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-all duration-300',
                    isCompleted && 'border-emerald-500 bg-emerald-500 text-white',
                    isCurrent && !isCompleted && 'border-brand-500 bg-brand-500 text-white shadow-lg shadow-brand-500/30',
                    !isCurrent && !isCompleted && 'border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={clsx(
                    'mt-2 text-xs font-medium transition-colors',
                    isCurrent ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400',
                    isCompleted && 'text-emerald-600 dark:text-emerald-400'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={clsx(
                    'mx-2 h-0.5 w-12 transition-colors duration-300',
                    isCompleted ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* モバイル表示 - シンプルなプログレスバー */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-900 dark:text-white">
            {steps[currentIndex]?.label}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {currentIndex + 1} / {steps.length}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500 ease-out"
            style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
