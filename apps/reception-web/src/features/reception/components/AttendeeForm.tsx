import { type SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { receptionFormSchema, type ReceptionForm } from '../types'
import { Button, GlassField } from '@/components/ui'

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
    grade: '高校3年生',
  },
  selections: [],
  notes: '',
}

export function AttendeeForm({ defaultValues, onSubmit, onBack }: AttendeeFormProps) {
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
      <GlassField label="参加者情報" description="基本情報を入力してください" required error={errors.attendee?.name?.message}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="glass-panel glass-outline flex flex-col gap-2 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              氏名
            </span>
            <input
              {...register('attendee.name')}
              className="rounded-xl border border-white/40 bg-white/70 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring focus:ring-brand-200/50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-brand-500 dark:focus:ring-brand-500/30"
              placeholder="山田 太郎"
            />
          </label>
          <label className="glass-panel glass-outline flex flex-col gap-2 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              フリガナ
            </span>
            <input
              {...register('attendee.furigana')}
              className="rounded-xl border border-white/40 bg-white/70 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring focus:ring-brand-200/50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-brand-500 dark:focus:ring-brand-500/30"
              placeholder="ヤマダ タロウ"
            />
          </label>
          <label className="glass-panel glass-outline flex flex-col gap-2 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              学校名
            </span>
            <input
              {...register('attendee.school')}
              className="rounded-xl border border-white/40 bg-white/70 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring focus:ring-brand-200/50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-brand-500 dark:focus:ring-brand-500/30"
              placeholder="〇〇高校"
            />
          </label>
          <label className="glass-panel glass-outline flex flex-col gap-2 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              学年
            </span>
            <select
              {...register('attendee.grade')}
              className="rounded-xl border border-white/40 bg-white/70 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring focus:ring-brand-200/50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-brand-500 dark:focus:ring-brand-500/30"
            >
              <option value="高校1年生">高校1年生</option>
              <option value="高校2年生">高校2年生</option>
              <option value="高校3年生">高校3年生</option>
              <option value="その他">その他</option>
            </select>
          </label>
        </div>

        <div className="glass-panel glass-outline flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              同伴者人数
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">保護者・ご友人の人数を入力してください</p>
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
          もどる
        </Button>
        <Button type="submit" loading={isSubmitting} className="min-w-[160px]">
          次へ進む
        </Button>
      </div>
    </form>
  )
}
