import { ArrowRight, CalendarCheck2, Footprints, UserPlus2 } from 'lucide-react'
import { Button, Card } from '@/components/ui'

interface ReceptionLandingProps {
  onStartReserved: () => void
  onStartWalkIn: () => void
}

export function ReceptionLanding({ onStartReserved, onStartWalkIn }: ReceptionLandingProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Card
        title="工学部オープンキャンパス 受付"
        description="予約者・当日参加の受付をタッチで進められます。手順は3ステップ、リアルタイムに状況が更新されます。"
        className="relative overflow-hidden"
        headerSlot={
          <Button variant="secondary" size="sm" icon={<Footprints className="h-4 w-4" />}>
            スタッフモード
          </Button>
        }
      >
        <div className="absolute -top-24 -right-20 h-56 w-56 rounded-full bg-gradient-to-br from-brand-400/40 to-sky-300/30 blur-3xl" />
        <div className="absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-gradient-to-br from-emerald-300/40 to-cyan-500/20 blur-3xl" />

        <div className="relative grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/40 bg-white/45 p-4 shadow-inner dark:border-white/10 dark:bg-slate-900/50">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                受付の流れ
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>1. モード選択（予約あり／予約なし）</li>
                <li>2. 情報入力とプログラム希望の選択</li>
                <li>3. ステータス確認と完了チケット表示</li>
              </ul>
            </div>
            <div className="glass-panel glass-outline grid grid-cols-2 gap-3 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">現在の待機</p>
                <p className="text-3xl font-semibold text-slate-900 dark:text-white">12名</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">平均所要時間</p>
                <p className="text-3xl font-semibold text-slate-900 dark:text-white">2分</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Button
              size="lg"
              className="w-full justify-between"
              icon={<CalendarCheck2 className="h-5 w-5" />}
              onClick={onStartReserved}
            >
              予約済みの方はこちら
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="w-full justify-between"
              icon={<UserPlus2 className="h-5 w-5" />}
              onClick={onStartWalkIn}
            >
              当日参加の受付
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>

      <Card title="リアルタイムステータス" description="施設内のプログラム残席や動線案内を常に更新します。">
        <div className="grid gap-4">
          {[
            { title: 'ミニキャップストーン', value: '残り 8/32', status: '余裕あり' },
            { title: '工学部説明会', value: '残り 15/40', status: '受付中' },
            { title: 'キャンパスツアー', value: '残り 2/20', status: 'まもなく満席' },
          ].map((item) => (
            <div
              key={item.title}
              className="glass-panel glass-outline flex items-center justify-between rounded-2xl p-4"
            >
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.status}</p>
              </div>
              <p className="text-lg font-semibold text-brand-600 dark:text-brand-300">{item.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
