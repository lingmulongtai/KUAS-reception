import { CheckCircle2, Users } from 'lucide-react'
import { type ProgramChoice } from '../types'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'

interface ProgramSelectionGridProps {
  programs: ProgramChoice[]
  selectedProgramIds: string[]
  maxSelections?: number
  onToggleProgram: (programId: string) => void
}

export function ProgramSelectionGrid({
  programs,
  selectedProgramIds,
  maxSelections = 3,
  onToggleProgram,
}: ProgramSelectionGridProps) {
  const { t } = useTranslation()

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {programs.map((program) => {
        const isSelected = selectedProgramIds.includes(program.id)
        const selectionOrder = selectedProgramIds.indexOf(program.id) + 1
        const disabled = !isSelected && selectedProgramIds.length >= maxSelections
        const isAlmostFull = program.remaining <= 5
        const isFull = program.remaining === 0

        return (
          <button
            key={program.id}
            type="button"
            disabled={disabled || isFull}
            onClick={() => onToggleProgram(program.id)}
            className={clsx(
              'group relative flex h-full min-w-0 flex-col gap-3 rounded-3xl border px-5 py-6 text-left transition-all duration-200 whitespace-normal break-words',
              'backdrop-blur shadow-lg',
              isFull 
                ? 'cursor-not-allowed bg-slate-200/60 border-slate-300/50 dark:bg-slate-800/40 dark:border-slate-700/50'
                : 'bg-white/55 border-white/50 hover:translate-y-[-2px] hover:shadow-xl dark:border-white/10 dark:bg-slate-900/60',
              !isFull && !disabled && 'hover:bg-white/70 dark:hover:bg-slate-900/80',
              disabled && !isFull && 'cursor-not-allowed opacity-50',
              isSelected && 'ring-2 ring-brand-400 bg-brand-50/50 dark:ring-brand-500/60 dark:bg-brand-900/20'
            )}
          >
            {/* 選択順バッジ - 選択時のみ表示 */}
            {isSelected && (
              <div className="absolute -top-3 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-sm font-bold text-white shadow-lg ring-2 ring-white dark:ring-slate-900">
                {selectionOrder}
              </div>
            )}
            
            {/* 残席警告バッジ */}
            {isAlmostFull && !isFull && (
              <div className="absolute -top-2 left-4 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                残りわずか
              </div>
            )}
            {isFull && (
              <div className="absolute -top-2 left-4 inline-flex items-center gap-1 rounded-full bg-slate-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                満席
              </div>
            )}

            <div className="flex min-w-0 flex-col gap-2">
              <h4 className={clsx(
                'text-lg font-semibold break-words',
                isFull ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-white'
              )}>
                {program.title}
              </h4>
              <p className={clsx(
                'text-sm break-words line-clamp-2',
                isFull ? 'text-slate-400 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'
              )}>
                {program.description ?? t('programs.mock.defaultDescription')}
              </p>
            </div>
            
            <div className="mt-auto flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                <Users className="h-4 w-4" />
                <span className={clsx(
                  'font-medium',
                  isAlmostFull && !isFull && 'text-amber-600 dark:text-amber-400',
                  isFull && 'text-slate-400'
                )}>
                  {isFull ? '満席' : `残り ${program.remaining}/${program.capacity}`}
                </span>
              </div>
              {isSelected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  第{selectionOrder}希望
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
