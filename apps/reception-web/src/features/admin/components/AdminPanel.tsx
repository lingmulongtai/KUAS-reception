import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  X,
  Users,
  Calendar,
  Settings,
  LogOut,
  BarChart3,
  Clock,
  CheckCircle2,
  UserCheck
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useAdmin } from '../hooks/useAdmin'
import { useReservations } from '../hooks/useReservations'
import { ReservationManager } from './ReservationManager'
import { ProgramEditor } from './ProgramEditor'
import { SettingsPanel } from './SettingsPanel'
import type { AdminTab } from '../types'

interface AdminPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const { t } = useTranslation()
  const { user, logout } = useAdmin()
  const { stats } = useReservations()
  const [activeTab, setActiveTab] = useState<AdminTab>('reservations')

  if (!isOpen) return null

  const handleLogout = async () => {
    await logout()
    onClose()
  }

  const tabs = [
    { id: 'reservations' as AdminTab, label: t('admin.tabs.reservations', '予約管理'), icon: Users },
    { id: 'programs' as AdminTab, label: t('admin.tabs.programs', 'プログラム'), icon: Calendar },
    { id: 'settings' as AdminTab, label: t('admin.tabs.settings', '設定'), icon: Settings },
  ]

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* パネル - 画面全体を覆う */}
      <div className="flex h-full w-full flex-col bg-white dark:bg-slate-900">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('admin.panel.title', '管理パネル')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {user?.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
            >
              <LogOut className="h-4 w-4" />
              <span>{t('admin.panel.logout', 'ログアウト')}</span>
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-2 gap-4 border-b border-slate-200 p-4 sm:grid-cols-4 dark:border-slate-700">
          <StatCard 
            icon={BarChart3} 
            label={t('admin.stats.total', '総予約数')} 
            value={stats.total}
            color="blue"
          />
          <StatCard 
            icon={Clock} 
            label={t('admin.stats.waiting', '待機中')} 
            value={stats.waiting}
            color="amber"
          />
          <StatCard 
            icon={CheckCircle2} 
            label={t('admin.stats.completed', '完了')} 
            value={stats.completed}
            color="emerald"
          />
          <StatCard 
            icon={UserCheck} 
            label={t('admin.stats.reserved', '事前予約')} 
            value={stats.reserved}
            color="purple"
          />
        </div>

        {/* タブ */}
        <div className="flex gap-1 border-b border-slate-200 px-4 dark:border-slate-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'reservations' && <ReservationManager />}
          {activeTab === 'programs' && <ProgramEditor />}
          {activeTab === 'settings' && <SettingsPanel />}
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: number
  color: 'blue' | 'amber' | 'emerald' | 'purple'
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white/50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex items-center gap-2">
        <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  )
}
