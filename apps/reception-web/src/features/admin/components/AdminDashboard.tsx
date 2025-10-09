import { useMemo } from 'react'
import { Card, Button, Badge } from '@/components/ui'
import { usePrograms } from '@/features/reception/hooks/usePrograms'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function AdminDashboard() {
  const { data: programs, isLoading } = usePrograms()
  const { t, i18n } = useTranslation()

  const metrics = useMemo(() => {
    const totalCapacity = programs?.reduce((acc, program) => acc + program.capacity, 0) ?? 0
    const totalRemaining = programs?.reduce((acc, program) => acc + program.remaining, 0) ?? 0

    return [
      {
        title: t('admin.dashboard.metrics.capacity.title'),
        value: t('admin.dashboard.metrics.capacity.value', { count: totalCapacity }),
        badge: t('admin.dashboard.metrics.capacity.badge'),
      },
      {
        title: t('admin.dashboard.metrics.remaining.title'),
        value: t('admin.dashboard.metrics.remaining.value', { count: totalRemaining }),
        badge: t('admin.dashboard.metrics.remaining.badge'),
      },
      {
        title: t('admin.dashboard.metrics.completed.title'),
        value: t('admin.dashboard.metrics.completed.value', { count: 128 }),
        badge: t('admin.dashboard.metrics.completed.badge'),
      },
      {
        title: t('admin.dashboard.metrics.waiting.title'),
        value: t('admin.dashboard.metrics.waiting.value', { count: 12 }),
        badge: t('admin.dashboard.metrics.waiting.badge'),
      },
    ]
  }, [i18n.language, programs, t])

  return (
    <div className="flex flex-col gap-6">
      <Card
        title={t('admin.dashboard.highlightsTitle')}
        description={t('admin.dashboard.highlightsDescription')}
        headerSlot={
          <Button
            variant="secondary"
            size="sm"
            icon={<ArrowRight className="h-4 w-4" />}
            className="whitespace-normal break-words"
          >
            {t('admin.dashboard.viewDetails')}
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.title} className="glass-panel glass-outline flex flex-col gap-3 rounded-3xl p-4 whitespace-normal break-words">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 break-words dark:text-slate-400">
                  {metric.badge}
                </p>
                <Badge variant="subtle"> {t('common.status.live')} </Badge>
              </div>
              <p className="mt-3 text-sm text-slate-600 break-words dark:text-slate-300">{metric.title}</p>
              <p className="text-2xl font-semibold text-slate-900 break-words dark:text-white">{metric.value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t('admin.dashboard.seatsTitle')} description={t('admin.dashboard.seatsDescription')}>
        <div className="overflow-hidden rounded-3xl">
          <table className="min-w-full divide-y divide-white/30 dark:divide-white/10">
            <thead className="bg-white/20 dark:bg-slate-900/40">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  {t('common.table.program')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  {t('common.table.capacity')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  {t('common.table.remaining')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20 dark:divide-white/10">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400" colSpan={3}>
                    {t('common.table.loading')}
                  </td>
                </tr>
              ) : (
                programs?.map((program) => (
                  <tr key={program.id} className="bg-white/10 backdrop-blur dark:bg-slate-900/30">
                    <td className="px-4 py-4 text-sm font-medium text-slate-800 dark:text-slate-100">
                      {program.title}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-slate-600 dark:text-slate-300">
                      {program.capacity}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-brand-600 dark:text-brand-300">
                      {program.remaining}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
