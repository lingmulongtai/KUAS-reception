import { useState } from 'react'
import { AttendeeForm } from './AttendeeForm'
import { ProgramSelectionStep } from './ProgramSelectionStep'
import { ConfirmationStep } from './ConfirmationStep'
import { usePrograms } from '../hooks/usePrograms'
import { type ReceptionForm } from '../types'
import { Button, Card, StepIndicator } from '@/components/ui'
import { CheckCircle2, Home, Sparkles, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type Step = 'attendee' | 'program' | 'confirm' | 'completed'

interface ReceptionFlowProps {
    mode: 'reserved' | 'walkIn'
    onCancel: () => void
    onComplete: () => void
}

export function ReceptionFlow({ mode, onCancel, onComplete }: ReceptionFlowProps) {
    const { t } = useTranslation()
    const { data: programs = [], isLoading } = usePrograms()
    const [step, setStep] = useState<Step>('attendee')

    const STEPS = [
      { id: 'attendee', label: t('flow.steps.attendee.title', '情報入力') },
      { id: 'program', label: t('flow.steps.programs.title', 'プログラム選択') },
      { id: 'confirm', label: t('flow.steps.confirm.title', '確認・完了') },
    ]

    const [formData, setFormData] = useState<Partial<ReceptionForm>>({
        attendee: {
            name: '',
            furigana: '',
            school: '',
            grade: 'grade3',
            companions: 0,
            reserved: mode === 'reserved',
        },
        selections: [],
    })

    const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([])
    const [completedSteps, setCompletedSteps] = useState<string[]>([])

    const handleAttendeeSubmit = (data: ReceptionForm) => {
        setFormData(prev => ({ ...prev, ...data }))
        setCompletedSteps(prev => [...prev, 'attendee'])
        setStep('program')
    }

    const handleProgramToggle = (id: string) => {
        setSelectedProgramIds(prev => {
            if (prev.includes(id)) return prev.filter(p => p !== id)
            if (prev.length >= 3) return prev
            return [...prev, id]
        })
    }

    const handleProgramNext = () => {
        setCompletedSteps(prev => [...prev, 'program'])
        setStep('confirm')
    }

    const handleConfirm = () => {
        setCompletedSteps(prev => [...prev, 'confirm'])
        setStep('completed')
    }

    if (step === 'completed') {
        return (
            <div className="flex flex-col items-center justify-center gap-8 py-16">
                {/* 成功アニメーション */}
                <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/30" />
                    <div className="relative rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 p-6 shadow-xl shadow-emerald-500/30">
                        <CheckCircle2 className="h-16 w-16 text-white" />
                    </div>
                    <Sparkles className="absolute -right-2 -top-2 h-8 w-8 text-amber-400 animate-pulse" />
                </div>
                
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {t('receptionFlow.completed.title', '受付完了！')}
                    </h2>
                    <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
                        {t('receptionFlow.completed.thankYou', '{{name}} 様、ご登録ありがとうございます', { name: formData.attendee?.name })}
                    </p>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">
                        {t('receptionFlow.completed.nextStep', '選択されたプログラムの案内は、スタッフがご説明します')}
                    </p>
                </div>

                {/* 選択したプログラムのサマリー */}
                {selectedProgramIds.length > 0 && (
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/80 p-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">
                            {t('receptionFlow.completed.selectedPrograms', '選択されたプログラム')}
                        </p>
                        <div className="space-y-2">
                            {programs
                                .filter(p => selectedProgramIds.includes(p.id))
                                .map((program, index) => (
                                    <div
                                        key={program.id}
                                        className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-2 dark:bg-slate-800"
                                    >
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                                            {index + 1}
                                        </span>
                                        <span className="font-medium text-slate-700 dark:text-slate-200">
                                            {program.title}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                <Button 
                    size="lg" 
                    icon={<Home className="h-5 w-5" />} 
                    onClick={onComplete}
                    className="mt-4"
                >
                    {t('receptionFlow.completed.returnHome', 'ホームに戻る')}
                </Button>
            </div>
        )
    }

    return (
        <div className="mx-auto w-full max-w-3xl">
            {/* ヘッダー：戻るボタンとステップ表示 */}
            <div className="mb-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t('receptionFlow.restart', '最初からやり直す')}
                </button>
                <StepIndicator
                    steps={STEPS}
                    currentStep={step}
                    completedSteps={completedSteps}
                />
            </div>

            {step === 'attendee' && (
                <Card 
                    title={t('receptionFlow.attendee.title', '参加者情報を入力してください')}
                    description={t('receptionFlow.attendee.description', '基本情報をご入力ください。入力いただいた情報は受付処理にのみ使用します。')}
                >
                    <AttendeeForm
                        defaultValues={formData}
                        onSubmit={handleAttendeeSubmit}
                        onBack={onCancel}
                    />
                </Card>
            )}

            {step === 'program' && (
                <Card 
                    title={t('receptionFlow.program.title', '参加したいプログラムを選択')}
                    description={t('receptionFlow.program.description', '興味のあるプログラムをタップしてください。最大3つまで、希望順に選択できます。')}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
                        </div>
                    ) : (
                        <ProgramSelectionStep
                            programs={programs}
                            selectedProgramIds={selectedProgramIds}
                            onToggleProgram={handleProgramToggle}
                            onNext={handleProgramNext}
                            onBack={() => setStep('attendee')}
                        />
                    )}
                </Card>
            )}

            {step === 'confirm' && formData.attendee && (
                <ConfirmationStep
                    attendee={formData.attendee as any}
                    selectedPrograms={programs.filter(p => selectedProgramIds.includes(p.id))}
                    onConfirm={handleConfirm}
                    onBack={() => setStep('program')}
                />
            )}
        </div>
    )
}
