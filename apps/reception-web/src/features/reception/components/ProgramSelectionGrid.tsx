import { CheckCircle2, Sparkles } from 'lucide-react'
import { type ProgramChoice } from '../types'
import clsx from 'clsx'

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
              'relative flex h-full flex-col gap-3 rounded-3xl border px-5 py-6 text-left transition-all',
              'backdrop-blur bg-white/55 border-white/50 shadow-lg hover:translate-y-[-2px] hover:bg-white/70 dark:border-white/10 dark:bg-slate-900/60 dark:hover:bg-slate-900/80',
              disabled && 'cursor-not-allowed opacity-50',
              isSelected ? 'ring-2 ring-brand-300 dark:ring-brand-500/60' : 'ring-0'
            )}
          >
            <div className="absolute -top-2 right-5 inline-flex items-center gap-1 rounded-full bg-brand-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-lg">
              <Sparkles className="h-3 w-3" />
              第{selectedProgramIds.indexOf(program.id) + 1}希望
            </div>
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.23em] text-slate-500 dark:text-slate-400">
              <span>プログラム</span>
              <span>
                残り <strong className="text-sm text-brand-600 dark:text-brand-300">{program.remaining}</strong>
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="text-lg font-semibold text-slate-800 dark:text-white">{program.title}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {program.description ?? 'ミニプロジェクト体験と研究室ツアーを組み合わせた人気プログラムです。'}
              </p>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>定員 {program.capacity} 名</span>
              {isSelected ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-500">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 選択中
                </span>
              ) : null}
            </div>
          </button>
        )
      })}
    </div>
  )
}
