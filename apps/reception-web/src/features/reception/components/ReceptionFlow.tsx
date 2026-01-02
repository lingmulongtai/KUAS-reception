import { useState } from 'react'
import { AttendeeForm } from './AttendeeForm'
import { ProgramSelectionStep } from './ProgramSelectionStep'
import { ConfirmationStep } from './ConfirmationStep'
import { usePrograms } from '../hooks/usePrograms'
import { type ReceptionForm } from '../types'
import { Button, Card } from '@/components/ui'
import { CheckCircle2, Home } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type Step = 'attendee' | 'program' | 'confirm' | 'completed'

interface ReceptionFlowProps {
    mode: 'reserved' | 'walkIn'
    onCancel: () => void
    onComplete: () => void
}

export function ReceptionFlow({ mode, onCancel, onComplete }: ReceptionFlowProps) {
    const { t } = useTranslation()
    const { data: programs = [] } = usePrograms()
    const [step, setStep] = useState<Step>('attendee')

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

    const handleAttendeeSubmit = (data: ReceptionForm) => {
        setFormData(prev => ({ ...prev, ...data }))
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
        setStep('confirm')
    }

    const handleConfirm = () => {
        setStep('completed')
    }

    if (step === 'completed') {
        return (
            <div className="flex flex-col items-center justify-center gap-6 py-10">
                <div className="rounded-full bg-emerald-100 p-6 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CheckCircle2 className="h-16 w-16" />
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('common.messages.success')}</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-300">{t('common.messages.receptionCompleted')}</p>
                </div>
                <Button size="lg" icon={<Home className="h-5 w-5" />} onClick={onComplete}>
                    {t('common.actions.returnHome')}
                </Button>
            </div>
        )
    }

    return (
        <div className="mx-auto w-full max-w-2xl">
            {step === 'attendee' && (
                <Card title={t('attendeeForm.title')} description={t('attendeeForm.description')}>
                    <AttendeeForm
                        defaultValues={formData}
                        onSubmit={handleAttendeeSubmit}
                        onBack={onCancel}
                    />
                </Card>
            )}

            {step === 'program' && (
                <Card title={t('programSelection.title')} description={t('programSelection.description')}>
                    <ProgramSelectionStep
                        programs={programs}
                        selectedProgramIds={selectedProgramIds}
                        onToggleProgram={handleProgramToggle}
                        onNext={handleProgramNext}
                        onBack={() => setStep('attendee')}
                    />
                </Card>
            )}

            {step === 'confirm' && formData.attendee && (
                <ConfirmationStep
                    attendee={formData.attendee as any} // Cast because Partial matches shape but Types might be strict
                    selectedPrograms={programs.filter(p => selectedProgramIds.includes(p.id))}
                    onConfirm={handleConfirm}
                    onBack={() => setStep('program')}
                />
            )}
        </div>
    )
}
