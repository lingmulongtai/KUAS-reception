import { useMemo, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { BadgeCheck, KeyRound, Lock } from 'lucide-react'
import { Button, Card, EmptyState, GlassField } from '@/components/ui'
import { useTranslation } from 'react-i18next'

interface AdminLoginForm {
  email: string
  password: string
}

interface AdminLoginProps {
  onSubmit: (credentials: AdminLoginForm) => Promise<void> | void
  loading?: boolean
  error?: string | null
  allowSelfDemo?: boolean
}

export function AdminLogin({ onSubmit, loading, error, allowSelfDemo = true }: AdminLoginProps) {
  const { t, i18n } = useTranslation()
  const [showDemoInfo, setShowDemoInfo] = useState(false)

  const adminLoginSchema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .min(1, t('validation.adminLogin.emailRequired'))
          .email(t('validation.adminLogin.emailInvalid')),
        password: z
          .string()
          .min(6, t('validation.adminLogin.passwordMin'))
          .max(64, t('validation.adminLogin.passwordMax')),
      }),
    [i18n.language, t]
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginForm>({
  resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const handleFormSubmit = async (data: AdminLoginForm) => {
    await onSubmit(data)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card
        title={t('admin.login.title')}
        description={t('admin.login.description')}
        className="max-w-xl"
      >
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
          <GlassField
            label={t('admin.login.emailLabel')}
            required
            error={errors.email?.message}
            description={t('admin.login.emailDescription')}
          >
            <label className="glass-panel glass-outline flex flex-col gap-2 p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {t('admin.login.emailFieldLabel')}
              </span>
              <div className="relative flex items-center">
                <KeyRound className="pointer-events-none absolute left-4 h-4 w-4 text-slate-400" />
                <input
                  {...register('email')}
                  type="email"
                  className="w-full rounded-xl border border-white/40 bg-white/70 px-4 py-3 pl-11 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring focus:ring-brand-200/50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-brand-500 dark:focus:ring-brand-500/30"
                  placeholder={t('admin.login.placeholders.email')}
                  autoComplete="email"
                />
              </div>
            </label>
          </GlassField>

          <GlassField
            label={t('admin.login.passwordLabel')}
            required
            error={errors.password?.message}
            description={t('admin.login.passwordDescription')}
          >
            <label className="glass-panel glass-outline flex flex-col gap-2 p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {t('admin.login.passwordFieldLabel')}
              </span>
              <div className="relative flex items-center">
                <Lock className="pointer-events-none absolute left-4 h-4 w-4 text-slate-400" />
                <input
                  {...register('password')}
                  type="password"
                  className="w-full rounded-xl border border-white/40 bg-white/70 px-4 py-3 pl-11 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring focus:ring-brand-200/50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-brand-500 dark:focus:ring-brand-500/30"
                  placeholder={t('admin.login.placeholders.password')}
                  autoComplete="current-password"
                />
              </div>
            </label>
          </GlassField>

          {error ? (
            <p className="rounded-2xl bg-rose-100/70 px-4 py-3 text-sm font-semibold text-rose-600 dark:bg-rose-500/20 dark:text-rose-100">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDemoInfo((prev) => !prev)}
              className="min-w-[120px]"
            >
              {showDemoInfo ? t('common.actions.hideDemo') : t('common.actions.showDemo')}
            </Button>
            <Button type="submit" size="md" loading={loading} icon={<BadgeCheck className="h-4 w-4" />} className="min-w-[140px]">
              {t('common.actions.login')}
            </Button>
          </div>
        </form>
      </Card>

      {allowSelfDemo && showDemoInfo ? (
        <EmptyState
          title={t('admin.login.demoTitle')}
          description={t('admin.login.demoDescription')}
          icon={KeyRound}
          action={
            <div className="glass-panel glass-outline flex flex-col gap-2 rounded-2xl p-4 text-left text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{t('admin.login.emailFieldLabel')}</p>
                <p className="font-mono text-slate-800 dark:text-slate-100">admin@kuas.jp</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{t('admin.login.passwordFieldLabel')}</p>
                <p className="font-mono text-slate-800 dark:text-slate-100">kuas-demo</p>
              </div>
            </div>
          }
        />
      ) : null}
    </div>
  )
}
