import { type SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { receptionFormSchema, type ReceptionForm } from '../types'
import { Button } from '@/components/ui'
import { useTranslation } from 'react-i18next'
import { ArrowRight, User, School, Users, GraduationCap } from 'lucide-react'
import clsx from 'clsx'

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

const inputClasses = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-brand-500 dark:focus:ring-brand-900/30'

export function AttendeeForm({ defaultValues, onSubmit, onBack }: AttendeeFormProps) {
  const { t } = useTranslation()

  const gradeOptions = [
    { value: 'grade1', label: t('attendeeForm.gradeOptions.grade1', '高校1年生') },
    { value: 'grade2', label: t('attendeeForm.gradeOptions.grade2', '高校2年生') },
    { value: 'grade3', label: t('attendeeForm.gradeOptions.grade3', '高校3年生') },
    { value: 'other', label: t('attendeeForm.gradeOptions.other', 'その他') },
  ]

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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

  const selectedGrade = watch('attendee.grade')
  const companions = watch('attendee.companions') || 0

  const submitHandler: SubmitHandler<ReceptionForm> = (data) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="flex flex-col gap-6">
      {/* 名前セクション */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <User className="h-5 w-5 text-brand-500" />
          <span className="font-semibold">{t('attendeeForm.nameLabel', 'お名前')}</span>
          <span className="ml-1 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">{t('common.labels.required', '必須')}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <input
              {...register('attendee.name')}
              className={clsx(inputClasses, errors.attendee?.name && 'border-rose-400 focus:border-rose-400 focus:ring-rose-100')}
              placeholder={t('attendeeForm.namePlaceholder', '山田 太郎')}
            />
            {errors.attendee?.name && (
              <p className="mt-1.5 text-sm text-rose-500">{errors.attendee.name.message}</p>
            )}
          </div>
          <div>
            <input
              {...register('attendee.furigana')}
              className={clsx(inputClasses, errors.attendee?.furigana && 'border-rose-400 focus:border-rose-400 focus:ring-rose-100')}
              placeholder={t('attendeeForm.furiganaPlaceholder', 'ヤマダ タロウ（フリガナ）')}
            />
            {errors.attendee?.furigana && (
              <p className="mt-1.5 text-sm text-rose-500">{errors.attendee.furigana.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* 学校名 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <School className="h-5 w-5 text-brand-500" />
          <span className="font-semibold">{t('attendeeForm.schoolLabel', '学校名')}</span>
          <span className="text-sm text-slate-400">{t('attendeeForm.optional', '（任意）')}</span>
        </div>
        <input
          {...register('attendee.school')}
          className={inputClasses}
          placeholder={t('attendeeForm.schoolPlaceholder', '〇〇高等学校')}
        />
      </div>

      {/* 学年 - ボタン選択式 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <GraduationCap className="h-5 w-5 text-brand-500" />
          <span className="font-semibold">{t('attendeeForm.gradeLabel', '学年')}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {gradeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setValue('attendee.grade', option.value as any)}
              className={clsx(
                'rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all',
                selectedGrade === option.value
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-900/30 dark:text-brand-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <input type="hidden" {...register('attendee.grade')} />
      </div>

      {/* 同伴者 - カウンター式 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <Users className="h-5 w-5 text-brand-500" />
          <span className="font-semibold">{t('attendeeForm.companionsLabel', '同伴者')}</span>
          <span className="text-sm text-slate-400">{t('attendeeForm.companionsHint', '（保護者・ご友人など）')}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setValue('attendee.companions', Math.max(0, companions - 1))}
            disabled={companions <= 0}
            className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-xl font-bold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            −
          </button>
          <div className="flex min-w-[80px] flex-col items-center">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{companions}</span>
            <span className="text-sm text-slate-500">{t('attendeeForm.companionsUnit', '名')}</span>
          </div>
          <button
            type="button"
            onClick={() => setValue('attendee.companions', Math.min(5, companions + 1))}
            disabled={companions >= 5}
            className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-xl font-bold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            +
          </button>
          <input type="hidden" {...register('attendee.companions', { valueAsNumber: true })} value={companions} />
        </div>
      </div>

      {/* ボタン */}
      <div className="flex justify-end gap-3 pt-4">
        <Button 
          type="submit" 
          size="lg"
          loading={isSubmitting} 
          icon={<ArrowRight className="h-5 w-5" />}
          className="min-w-[180px]"
        >
          {t('attendeeForm.nextButton', 'プログラム選択へ')}
        </Button>
      </div>
    </form>
  )
}
