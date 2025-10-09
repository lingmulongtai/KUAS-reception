import { ArrowRight, CalendarCheck2, Footprints, UserPlus2 } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useTranslation } from 'react-i18next'

interface ReceptionLandingProps {
  onStartReserved: () => void
  onStartWalkIn: () => void
}

export function ReceptionLanding({ onStartReserved, onStartWalkIn }: ReceptionLandingProps) {
  const { t } = useTranslation()
  const flowSteps = t('landing.flowSteps', { returnObjects: true }) as string[]
  const statusItems = Object.values(
    t('landing.statusItems', { returnObjects: true }) as Record<string, { title: string; value: string; status: string }>
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Card
        title={t('landing.title')}
        description={t('landing.description')}
        className="relative overflow-hidden whitespace-normal break-words"
        headerSlot={
          <Button variant="secondary" size="sm" icon={<Footprints className="h-4 w-4" />}>
            {t('landing.staffMode')}
          </Button>
        }
      >
        <div className="absolute -top-24 -right-20 h-56 w-56 rounded-full bg-gradient-to-br from-brand-400/40 to-sky-300/30 blur-3xl" />
        <div className="absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-gradient-to-br from-emerald-300/40 to-cyan-500/20 blur-3xl" />

        <div className="relative grid gap-4 lg:grid-cols-2 whitespace-normal break-words">
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/40 bg-white/45 p-4 shadow-inner dark:border-white/10 dark:bg-slate-900/50">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 break-words dark:text-slate-400">
                {t('landing.flowTitle')}
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {flowSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
            <div className="glass-panel glass-outline grid grid-cols-2 gap-3 p-4 whitespace-normal break-words">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 break-words dark:text-slate-400">
                  {t('landing.currentQueue')}
                </p>
                <p className="text-3xl font-semibold text-slate-900 dark:text-white">{t('landing.queueCount', { count: 12 })}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 break-words dark:text-slate-400">
                  {t('landing.averageTime')}
                </p>
                <p className="text-3xl font-semibold text-slate-900 dark:text-white">{t('landing.averageDuration', { minutes: 2 })}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Button
              size="lg"
              className="w-full justify-between whitespace-normal break-words"
              icon={<CalendarCheck2 className="h-5 w-5" />}
              onClick={onStartReserved}
            >
              {t('landing.reservedButton')}
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="w-full justify-between whitespace-normal break-words"
              icon={<UserPlus2 className="h-5 w-5" />}
              onClick={onStartWalkIn}
            >
              {t('landing.walkInButton')}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>

      <Card title={t('landing.statusCardTitle')} description={t('landing.statusCardDescription')}>
        <div className="grid gap-4">
          {statusItems.map((item) => (
            <div
              key={item.title}
              className="glass-panel glass-outline flex flex-wrap items-center justify-between gap-2 rounded-2xl p-4 whitespace-normal break-words"
            >
              <div>
                <p className="text-sm font-semibold text-slate-700 break-words dark:text-slate-200">{item.title}</p>
                <p className="text-xs text-slate-500 break-words dark:text-slate-400">{item.status}</p>
              </div>
              <p className="text-lg font-semibold text-brand-600 break-words dark:text-brand-300">{item.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
