import { useMemo } from 'react'
import { ArrowLeft, ArrowRight, Info } from 'lucide-react'
import { Button } from '@/components/ui'
import { type ProgramChoice } from '../types'
import { ProgramSelectionGrid } from './ProgramSelectionGrid'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'

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
    <div className="flex flex-col gap-6">
      {/* ヒント表示 */}
      <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-800 dark:bg-brand-900/20">
        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-500" />
        <div className="text-sm text-brand-700 dark:text-brand-300">
          <p className="font-medium">{t('programSelection.tapToSelect', 'タップして選択してください')}</p>
          <p className="mt-0.5 text-brand-600/80 dark:text-brand-400/80">
            {t('programSelection.maxHint', '最大{{count}}つまで選べます。選んだ順番が希望順位になります。', { count: maxSelections })}
          </p>
        </div>
      </div>

      {/* プログラムグリッド */}
      <ProgramSelectionGrid
        programs={programs}
        selectedProgramIds={selectedProgramIds}
        maxSelections={maxSelections}
        onToggleProgram={onToggleProgram}
      />

      {/* 選択結果サマリー */}
      {selectedPrograms.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">
            {t('programSelection.selectedCount', '選択中のプログラム（{{current}}/{{max}}）', { current: selectedPrograms.length, max: maxSelections })}
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedPrograms.map((program, index) => (
              <span
                key={program.id}
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm dark:bg-slate-700 dark:text-slate-200"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                  {index + 1}
                </span>
                {program.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ナビゲーションボタン */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <Button 
          variant="ghost" 
          size="md" 
          icon={<ArrowLeft className="h-4 w-4" />} 
          onClick={onBack}
        >
          {t('common.actions.back', '戻る')}
        </Button>
        <Button
          variant="primary"
          size="lg"
          icon={<ArrowRight className="h-5 w-5" />}
          onClick={onNext}
          disabled={!canProceed}
          className={clsx(
            'min-w-[160px] transition-all',
            !canProceed && 'opacity-50'
          )}
        >
          {canProceed ? t('programSelection.proceed', '確認へ進む') : t('programSelection.selectProgram', 'プログラムを選択')}
        </Button>
      </div>
    </div>
  )
}
