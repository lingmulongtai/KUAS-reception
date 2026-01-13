import { ArrowRight, CalendarCheck2, UserPlus2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ReceptionLandingProps {
  onStartReserved: () => void
  onStartWalkIn: () => void
}

export function ReceptionLanding({ onStartReserved, onStartWalkIn }: ReceptionLandingProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-8">
      {/* ウェルカムメッセージ */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
          {t('landing.welcome', 'ようこそ！')}
        </h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
          {t('landing.welcomeDescription', '工学部オープンキャンパスへのご参加ありがとうございます')}
        </p>
      </div>

      {/* メイン選択ボタン */}
      <div className="grid w-full max-w-xl gap-4">
        <button
          type="button"
          onClick={onStartReserved}
          className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-600 p-6 text-left text-white shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <CalendarCheck2 className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t('landing.reservedTitle', '事前予約済みの方')}</h2>
                <p className="mt-0.5 text-sm text-white/80">
                  {t('landing.reservedSubtitle', '予約番号をお持ちの方はこちら')}
                </p>
              </div>
            </div>
            <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
          </div>
        </button>

        <button
          type="button"
          onClick={onStartWalkIn}
          className="group relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-white/80 p-6 text-left shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-brand-300 hover:shadow-xl active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900/80 dark:hover:border-brand-500"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <UserPlus2 className="h-7 w-7 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t('landing.walkInTitle', '当日参加の方')}
                </h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  {t('landing.walkInSubtitle', '予約なしでも参加できます')}
                </p>
              </div>
            </div>
            <ArrowRight className="h-6 w-6 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-brand-500" />
          </div>
        </button>
      </div>

      {/* 簡易フロー説明 */}
      <div className="mt-4 flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-600 dark:bg-brand-900 dark:text-brand-300">
          1
        </span>
        <span>{t('landing.step1', '情報入力')}</span>
        <span className="text-slate-300 dark:text-slate-600">→</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-600 dark:bg-brand-900 dark:text-brand-300">
          2
        </span>
        <span>{t('landing.step2', 'プログラム選択')}</span>
        <span className="text-slate-300 dark:text-slate-600">→</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-600 dark:bg-brand-900 dark:text-brand-300">
          3
        </span>
        <span>{t('landing.step3', '完了')}</span>
      </div>
    </div>
  )
}
