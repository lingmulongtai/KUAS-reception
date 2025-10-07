import { useMemo } from 'react'
import { Card, Button, Badge } from '@/components/ui'
import { usePrograms } from '@/features/reception/hooks/usePrograms'
import { ArrowRight } from 'lucide-react'

export function AdminDashboard() {
  const { data: programs, isLoading } = usePrograms()

  const metrics = useMemo(() => {
    const totalCapacity = programs?.reduce((acc, program) => acc + program.capacity, 0) ?? 0
    const totalRemaining = programs?.reduce((acc, program) => acc + program.remaining, 0) ?? 0

    return [
      {
        title: '総定員',
        value: `${totalCapacity} 名`,
        badge: 'Capacity',
      },
      {
        title: '残り枠',
        value: `${totalRemaining} 名`,
        badge: 'Remaining',
      },
      {
        title: '受付完了',
        value: '128 名',
        badge: 'Completed',
      },
      {
        title: '待機者',
        value: '12 名',
        badge: 'Waiting',
      },
    ]
  }, [programs])

  return (
    <div className="flex flex-col gap-6">
      <Card
        title="運営ハイライト"
        description="リアルタイムでイベント状況を確認できます。"
        headerSlot={
          <Button variant="secondary" size="sm" icon={<ArrowRight className="h-4 w-4" />}>
            詳細を見る
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.title} className="glass-panel glass-outline rounded-3xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {metric.badge}
                </p>
                <Badge variant="subtle"> LIVE </Badge>
              </div>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{metric.title}</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{metric.value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="プログラム残席" description="各プログラムの最新状況を確認し、必要に応じて調整できます。">
        <div className="overflow-hidden rounded-3xl">
          <table className="min-w-full divide-y divide-white/30 dark:divide-white/10">
            <thead className="bg-white/20 dark:bg-slate-900/40">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  プログラム
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  定員
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  残り
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20 dark:divide-white/10">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400" colSpan={3}>
                    ローディング...
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
