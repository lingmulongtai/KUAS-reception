import { CheckCircle2, Sparkles } from 'lucide-react'
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
        const disabled = !isSelected && selectedProgramIds.length >= maxSelections

        return (
          <button
            key={program.id}
            type="button"
            disabled={disabled}
            onClick={() => onToggleProgram(program.id)}
            className={clsx(
              'relative flex h-full min-w-0 flex-col gap-3 rounded-3xl border px-5 py-6 text-left transition-all whitespace-normal break-words',
              'backdrop-blur bg-white/55 border-white/50 shadow-lg hover:translate-y-[-2px] hover:bg-white/70 dark:border-white/10 dark:bg-slate-900/60 dark:hover:bg-slate-900/80',
              disabled && 'cursor-not-allowed opacity-50',
              isSelected ? 'ring-2 ring-brand-300 dark:ring-brand-500/60' : 'ring-0'
            )}
          >
            <div className="absolute -top-2 right-5 inline-flex items-center gap-1 rounded-full bg-brand-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-lg">
              <Sparkles className="h-3 w-3 flex-shrink-0" />
              <span className="min-w-0 break-words">
                {t('common.labels.choiceOrder', { order: selectedProgramIds.indexOf(program.id) + 1 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.23em] text-slate-500 dark:text-slate-400">
              <span>{t('common.labels.program')}</span>
              <span>
                {t('common.labels.remainingSeats', { count: program.remaining })}
              </span>
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <h4 className="text-lg font-semibold text-slate-800 break-words dark:text-white">{program.title}</h4>
              <p className="text-sm text-slate-500 break-words dark:text-slate-400">
                {program.description ?? t('programs.mock.defaultDescription')}
              </p>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>{t('common.labels.capacityWithCount', { count: program.capacity })}</span>
              {isSelected ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-500">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {t('common.labels.selected')}
                </span>
              ) : null}
            </div>
          </button>
        )
      })}
    </div>
  )
}
