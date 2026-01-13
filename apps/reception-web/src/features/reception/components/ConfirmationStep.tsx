import { ArrowLeft, CheckCircle, User, GraduationCap, Users, School } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { type ProgramChoice } from '../types'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'

interface ConfirmationStepProps {
  attendee: {
    name: string
    furigana: string
    school?: string
    grade: string
    companions: number
    reserved: boolean
  }
  selectedPrograms: ProgramChoice[]
  onConfirm: () => void
  onBack: () => void
  onShareTicket?: () => void
  onPrintTicket?: () => void
}

export function ConfirmationStep({
  attendee,
  selectedPrograms,
  onConfirm,
  onBack,
}: ConfirmationStepProps) {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const gradeLabels: Record<string, string> = {
    grade1: t('attendeeForm.gradeOptions.grade1', '高校1年生'),
    grade2: t('attendeeForm.gradeOptions.grade2', '高校2年生'),
    grade3: t('attendeeForm.gradeOptions.grade3', '高校3年生'),
    other: t('attendeeForm.gradeOptions.other', 'その他'),
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      // 開発環境ではAPIコールをスキップ
      if (import.meta.env.DEV || !import.meta.env.VITE_API_BASE_URL) {
        await new Promise((resolve) => setTimeout(resolve, 800))
      } else {
        const { apiClient } = await import('@/services')
        await apiClient.post('/receptions', {
          attendee,
          selections: selectedPrograms.map((p) => ({ id: p.id, title: p.title })),
        })
      }
      onConfirm()
    } catch (error) {
      console.error('Reception submission failed:', error)
      // エラーでも完了画面に進む（オフライン対応のため）
      onConfirm()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card
        title={t('confirmation.reviewTitle', '入力内容の確認')}
        description={t('confirmation.reviewDescription', '以下の内容で受付を完了します。内容をご確認ください。')}
      >
        <div className="space-y-6">
          {/* 参加者情報 */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
            <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
              <User className="h-4 w-4" />
              {t('confirmation.attendeeInfo', '参加者情報')}
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">{t('attendeeForm.nameLabel', 'お名前')}</p>
                <p className="mt-0.5 text-lg font-semibold text-slate-900 dark:text-white">{attendee.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{attendee.furigana}</p>
              </div>
              {attendee.school && (
                <div className="flex items-start gap-2">
                  <School className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{t('attendeeForm.schoolLabel', '学校名')}</p>
                    <p className="mt-0.5 font-medium text-slate-700 dark:text-slate-200">{attendee.school}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <GraduationCap className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{t('attendeeForm.gradeLabel', '学年')}</p>
                  <p className="mt-0.5 font-medium text-slate-700 dark:text-slate-200">
                    {gradeLabels[attendee.grade] || attendee.grade}
                  </p>
                </div>
              </div>
              {attendee.companions > 0 && (
                <div className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{t('attendeeForm.companionsLabel', '同伴者')}</p>
                    <p className="mt-0.5 font-medium text-slate-700 dark:text-slate-200">{attendee.companions}{t('attendeeForm.companionsUnit', '名')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 選択プログラム */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
            <h4 className="mb-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
              {t('confirmation.selectedPrograms', '選択されたプログラム')}
            </h4>
            <div className="space-y-3">
              {selectedPrograms.map((program, index) => (
                <div
                  key={program.id}
                  className="flex items-center gap-4 rounded-xl bg-white px-4 py-3 shadow-sm dark:bg-slate-700"
                >
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">{program.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t('confirmation.seatsRemaining', '残り {{remaining}}/{{capacity}} 席', { remaining: program.remaining, capacity: program.capacity })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 確定ボタン */}
      <div className="flex items-center justify-between gap-4">
        <Button 
          variant="ghost" 
          size="md" 
          icon={<ArrowLeft className="h-4 w-4" />} 
          onClick={onBack}
          disabled={isSubmitting}
        >
          {t('common.actions.back', '戻る')}
        </Button>
        <Button
          variant="primary"
          size="lg"
          icon={<CheckCircle className="h-5 w-5" />}
          onClick={handleConfirm}
          loading={isSubmitting}
          className={clsx(
            'min-w-[200px] bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25',
            'hover:from-emerald-400 hover:to-emerald-500'
          )}
        >
          {isSubmitting ? t('confirmation.submitting', '送信中...') : t('confirmation.complete', '受付を完了する')}
        </Button>
      </div>
    </div>
  )
}
