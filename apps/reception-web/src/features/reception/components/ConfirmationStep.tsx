import { ArrowLeft, BadgeCheck, Printer, Share } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { type ProgramChoice } from '../types'
import { apiClient } from '@/services'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ConfirmationStepProps {
  attendeeName: string
  selectedPrograms: ProgramChoice[]
  onConfirm: () => void
  onBack: () => void
  onShareTicket?: () => void
  onPrintTicket?: () => void
}

export function ConfirmationStep({
  attendeeName,
  selectedPrograms,
  onConfirm,
  onBack,
  onShareTicket,
  onPrintTicket,
}: ConfirmationStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { t } = useTranslation()

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await apiClient.post('/receptions', {
        attendee: { name: attendeeName },
        selections: selectedPrograms.map((p) => ({ id: p.id, title: p.title })),
      })
      onConfirm()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card
        title={t('confirmation.title')}
        description={t('confirmation.description')}
      >
        <div className="glass-panel glass-outline flex flex-col gap-3 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('common.labels.participant')}</p>
            <p className="text-lg font-semibold text-brand-600 dark:text-brand-300">{attendeeName}</p>
          </div>
          <div className="grid gap-3">
            {selectedPrograms.map((program, index) => (
              <div
                key={program.id}
                className="rounded-2xl border border-white/40 bg-white/50 px-4 py-3 text-sm text-slate-700 shadow-inner dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
              >
                {t('common.labels.choiceOrderWithProgram', { order: index + 1, program: program.title })}
                （{t('common.labels.remainingSeats', { count: program.remaining })}）
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card
        title={t('confirmation.ticketTitle')}
        description={t('confirmation.ticketDescription')}
        footerSlot={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" size="sm" icon={<Share className="h-4 w-4" />} onClick={onShareTicket}>
              {t('common.actions.shareQr')}
            </Button>
            <Button variant="secondary" size="sm" icon={<Printer className="h-4 w-4" />} onClick={onPrintTicket}>
              {t('common.actions.print')}
            </Button>
            <Button variant="primary" size="sm" icon={<BadgeCheck className="h-4 w-4" />} onClick={handleConfirm} loading={isSubmitting}>
              {t('common.actions.confirmReception')}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('confirmation.syncNote')}</p>
      </Card>

      <div className="flex justify-between gap-3">
        <Button variant="ghost" size="md" icon={<ArrowLeft className="h-4 w-4" />} onClick={onBack}>
          {t('common.actions.back')}
        </Button>
        <Button variant="primary" size="md" icon={<BadgeCheck className="h-4 w-4" />} onClick={handleConfirm} loading={isSubmitting}>
          {t('common.actions.confirm')}
        </Button>
      </div>
    </div>
  )
}
