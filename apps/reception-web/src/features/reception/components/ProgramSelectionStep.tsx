import { useMemo } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button, GlassField } from '@/components/ui'
import { type ProgramChoice } from '../types'
import { ProgramSelectionGrid } from './ProgramSelectionGrid'

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
  const canProceed = selectedProgramIds.length > 0

  const selectedPrograms = useMemo(
    () => programs.filter((program) => selectedProgramIds.includes(program.id)),
    [programs, selectedProgramIds]
  )

  return (
    <div className="flex flex-col gap-5">
      <GlassField
        label="プログラム選択"
        description="第1希望から第3希望まで選択できます。優先順位はあとで変更できます。"
        hint={`最大 ${maxSelections} 件まで選択可能です。`}
      >
        <ProgramSelectionGrid
          programs={programs}
          selectedProgramIds={selectedProgramIds}
          maxSelections={maxSelections}
          onToggleProgram={onToggleProgram}
        />
      </GlassField>

      <GlassField
        label="選択結果"
        description="現在選択されているプログラムです。順番が希望順位になります。"
      >
        <div className="glass-panel glass-outline grid gap-3 rounded-2xl p-4">
          {selectedPrograms.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              まだプログラムが選択されていません。希望のプログラムを選択してください。
            </p>
          ) : (
            <ol className="grid gap-2">
              {selectedPrograms.map((program, index) => (
                <li
                  key={program.id}
                  className="flex items-center justify-between rounded-xl bg-white/60 px-4 py-3 text-sm font-medium text-slate-700 shadow-inner dark:bg-slate-900/60 dark:text-slate-200"
                >
                  <span>
                    第{index + 1}希望：{program.title}
                  </span>
                  <span className="text-xs text-slate-500">残り {program.remaining}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </GlassField>

      <div className="flex justify-between gap-3">
        <Button variant="ghost" size="md" icon={<ArrowLeft className="h-4 w-4" />} onClick={onBack}>
          もどる
        </Button>
        <Button
          variant="primary"
          size="md"
          icon={<ArrowRight className="h-4 w-4" />}
          onClick={onNext}
          disabled={!canProceed}
        >
          次へ進む
        </Button>
      </div>
    </div>
  )
}
