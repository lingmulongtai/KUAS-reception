import { type SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { receptionFormSchema, type ReceptionForm } from '../types'
import { Button, GlassField } from '@/components/ui'
import { useTranslation } from 'react-i18next'

interface AttendeeFormProps {
  defaultValues?: Partial<ReceptionForm>
  onSubmit: (data: ReceptionForm) => void
  onBack?: () => void
}

const defaultFormValues: ReceptionForm = {
  attendee: {
    name: '',
    furigana: '',
    companions: 0,
    reserved: true,
    grade: 'grade3',
  },
  selections: [],
  notes: '',
}

export function AttendeeForm({ defaultValues, onSubmit, onBack }: AttendeeFormProps) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReceptionForm>({
    resolver: zodResolver(receptionFormSchema),
    defaultValues: {
      ...defaultFormValues,
      ...defaultValues,
      attendee: {
        ...defaultFormValues.attendee,
        ...defaultValues?.attendee,
      },
    },
  })

  const submitHandler: SubmitHandler<ReceptionForm> = (data) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="flex flex-col gap-4">
      <GlassField
        label={t('attendeeForm.title')}
        description={t('attendeeForm.description')}
        required
        error={errors.attendee?.name?.message}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="glass-panel glass-outline flex flex-col gap-2 p-4 whitespace-normal break-words">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {t('attendeeForm.nameLabel')}
            </span>
            <input
              {...register('attendee.name')}
              className="rounded-xl border border-white/40 bg-white/70 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring focus:ring-brand-200/50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-brand-500 dark:focus:ring-brand-500/30"
              placeholder={t('attendeeForm.namePlaceholder')}
            />
          </label>
          <label className="glass-panel glass-outline flex flex-col gap-2 p-4 whitespace-normal break-words">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {t('attendeeForm.furiganaLabel')}
            </span>
            <input
              {...register('attendee.furigana')}
              className="rounded-xl border border-white/40 bg-white/70 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring focus:ring-brand-200/50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-brand-500 dark:focus:ring-brand-500/30"
              placeholder={t('attendeeForm.furiganaPlaceholder')}
            />
          </label>
          <label className="glass-panel glass-outline flex flex-col gap-2 p-4 whitespace-normal break-words">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {t('attendeeForm.schoolLabel')}
            </span>
            <input
              {...register('attendee.school')}
              className="rounded-xl border border-white/40 bg-white/70 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring focus:ring-brand-200/50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-brand-500 dark:focus:ring-brand-500/30"
              placeholder={t('attendeeForm.schoolPlaceholder')}
            />
          </label>
          <label className="glass-panel glass-outline flex flex-col gap-2 p-4 whitespace-normal break-words">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {t('attendeeForm.gradeLabel')}
            </span>
            <select
              {...register('attendee.grade')}
              className="rounded-xl border border-white/40 bg-white/70 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring focus:ring-brand-200/50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-brand-500 dark:focus:ring-brand-500/30"
            >
              <option value="grade1">{t('attendeeForm.gradeOptions.grade1')}</option>
              <option value="grade2">{t('attendeeForm.gradeOptions.grade2')}</option>
              <option value="grade3">{t('attendeeForm.gradeOptions.grade3')}</option>
              <option value="other">{t('attendeeForm.gradeOptions.other')}</option>
            </select>
          </label>
        </div>

        <div className="glass-panel glass-outline flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between whitespace-normal break-words">
          <div className="min-w-0 break-words">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {t('attendeeForm.companionsLabel')}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('attendeeForm.companionsDescription')}</p>
          </div>
          <input
            type="number"
            min={0}
            max={5}
            {...register('attendee.companions', { valueAsNumber: true })}
            className="w-24 rounded-xl border border-white/40 bg-white/70 px-4 py-3 text-center text-lg font-semibold text-slate-700 outline-none transition focus:border-brand-300 focus:ring focus:ring-brand-200/50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-brand-500 dark:focus:ring-brand-500/30"
          />
        </div>
      </GlassField>

      <div className="flex justify-between gap-3">
        <Button variant="ghost" onClick={onBack} type="button" className="min-w-[120px]">
          {t('common.actions.back')}
        </Button>
        <Button type="submit" loading={isSubmitting} className="min-w-[160px]">
          {t('common.actions.next')}
        </Button>
      </div>
    </form>
  )
}
