import { useMemo } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button, GlassField } from '@/components/ui'
import { type ProgramChoice } from '../types'
import { ProgramSelectionGrid } from './ProgramSelectionGrid'
import { useTranslation } from 'react-i18next'

interface ProgramSelectionStepProps {
  programs: ProgramChoice[]
  selectedProgramIds: string[]
  maxSelections?: number
  onToggleProgram: (programId: string) => void
  onNext: () => void
  onBack: () => void
}

export function ProgramSelectionStep({
  programs,
  selectedProgramIds,
  maxSelections = 3,
  onToggleProgram,
  onNext,
  onBack,
}: ProgramSelectionStepProps) {
  const { t } = useTranslation()
  const canProceed = selectedProgramIds.length > 0

  const selectedPrograms = useMemo(
    () => programs.filter((program) => selectedProgramIds.includes(program.id)),
    [programs, selectedProgramIds]
  )

  return (
    <div className="flex flex-col gap-5">
      <GlassField
        label={t('programSelection.title')}
        description={t('programSelection.description')}
        hint={t('programSelection.hint', { count: maxSelections })}
      >
        <ProgramSelectionGrid
          programs={programs}
          selectedProgramIds={selectedProgramIds}
          maxSelections={maxSelections}
          onToggleProgram={onToggleProgram}
        />
      </GlassField>

      <GlassField
        label={t('programSelection.resultsTitle')}
        description={t('programSelection.resultsDescription')}
      >
        <div className="glass-panel glass-outline grid gap-3 rounded-2xl p-4 whitespace-normal break-words">
          {selectedPrograms.length === 0 ? (
            <p className="text-sm text-slate-500 break-words dark:text-slate-400">
              {t('programSelection.emptySelection')}
            </p>
          ) : (
            <ol className="grid gap-2">
              {selectedPrograms.map((program, index) => (
                <li
                  key={program.id}
                  className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-xl bg-white/60 px-4 py-3 text-sm font-medium text-slate-700 shadow-inner dark:bg-slate-900/60 dark:text-slate-200"
                >
                  <span className="min-w-0 break-words">
                    {t('common.labels.choiceOrderWithProgram', {
                      order: index + 1,
                      program: program.title,
                    })}
                  </span>
                  <span className="text-xs text-slate-500 break-words">
                    {t('common.labels.remainingSeats', { count: program.remaining })}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </GlassField>

      <div className="flex flex-wrap justify-between gap-3">
        <Button variant="ghost" size="md" icon={<ArrowLeft className="h-4 w-4" />} onClick={onBack}>
          {t('common.actions.back')}
        </Button>
        <Button
          variant="primary"
          size="md"
          icon={<ArrowRight className="h-4 w-4" />}
          onClick={onNext}
          disabled={!canProceed}
        >
          {t('common.actions.next')}
        </Button>
      </div>
    </div>
  )
}
