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
        className="relative overflow-hidden"
        headerSlot={
          <Button variant="secondary" size="sm" icon={<Footprints className="h-4 w-4" />}>
            {t('landing.staffMode')}
          </Button>
        }
      >
        <div className="relative grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t('landing.flowTitle')}
              </p>
              <ul className="mt-3 space-y-2 text-sm font-medium text-slate-900 dark:text-slate-200">
                {flowSteps.map((step, i) => (
                  <li key={step} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-xs text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('landing.currentQueue')}
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                  {t('landing.queueCount', { count: 12 })}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('landing.averageTime')}
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                  {t('landing.averageDuration', { minutes: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 justify-center">
            <Button
              size="lg"
              className="h-20 w-full justify-between px-6 text-lg"
              icon={<CalendarCheck2 className="h-6 w-6" />}
              onClick={onStartReserved}
            >
              <div className="text-left">
                <div className="font-bold">{t('landing.reservedButton')}</div>
                <div className="text-xs opacity-80 font-normal">Pre-booked attendees</div>
              </div>
              <ArrowRight className="h-6 w-6" />
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-20 w-full justify-between px-6 text-lg"
              icon={<UserPlus2 className="h-6 w-6" />}
              onClick={onStartWalkIn}
            >
              <div className="text-left">
                <div className="font-bold">{t('landing.walkInButton')}</div>
                <div className="text-xs opacity-80 font-normal">New registration</div>
              </div>
              <ArrowRight className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </Card>

      <Card title={t('landing.statusCardTitle')} description={t('landing.statusCardDescription')}>
        <div className="grid gap-3">
          {statusItems.map((item) => (
            <div
              key={item.title}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900"
            >
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.status}</p>
              </div>
              <p className="text-xl font-bold text-brand-600 dark:text-brand-400">{item.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
