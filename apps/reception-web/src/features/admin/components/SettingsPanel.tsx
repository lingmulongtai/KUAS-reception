import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Save, 
  Loader2, 
  Calendar,
  Clock,
  ToggleLeft,
  ToggleRight,
  Hash,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useSettings } from '../hooks/useSettings'

export function SettingsPanel() {
  const { t } = useTranslation()
  const { settings, loading, updateSettings } = useSettings()
  const [saving, setSaving] = useState(false)
  const [localSettings, setLocalSettings] = useState(settings)

  // settingsが変更されたらlocalSettingsも更新
  if (JSON.stringify(settings) !== JSON.stringify(localSettings) && !saving) {
    setLocalSettings(settings)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSettings(localSettings)
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(localSettings)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('admin.settings.title', '受付設定')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('admin.settings.description', 'オープンキャンパスの受付に関する設定を変更できます')}
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || saving}
          className="gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{t('admin.settings.save', '保存')}</span>
        </Button>
      </div>

      {/* 設定項目 */}
      <div className="space-y-6">
        {/* 受付状態 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-3 ${localSettings.isOpen ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                {localSettings.isOpen ? (
                  <ToggleRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white">
                  {t('admin.settings.receptionStatus', '受付状態')}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {localSettings.isOpen 
                    ? t('admin.settings.receptionOpen', '現在、受付を受け付けています')
                    : t('admin.settings.receptionClosed', '現在、受付は停止しています')
                  }
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLocalSettings({ ...localSettings, isOpen: !localSettings.isOpen })}
              className={`relative h-8 w-14 rounded-full transition-colors ${
                localSettings.isOpen ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  localSettings.isOpen ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* イベント情報 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-brand-100 p-3 dark:bg-brand-900/30">
              <Calendar className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            </div>
            <h4 className="font-semibold text-slate-900 dark:text-white">
              {t('admin.settings.eventInfo', 'イベント情報')}
            </h4>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('admin.settings.eventName', 'イベント名')}
              </label>
              <input
                type="text"
                value={localSettings.eventName || ''}
                onChange={(e) => setLocalSettings({ ...localSettings, eventName: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                placeholder="オープンキャンパス"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('admin.settings.eventDate', '開催日')}
              </label>
              <input
                type="date"
                value={localSettings.eventDate || ''}
                onChange={(e) => setLocalSettings({ ...localSettings, eventDate: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* 受付時間 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-3 dark:bg-amber-900/30">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h4 className="font-semibold text-slate-900 dark:text-white">
              {t('admin.settings.receptionHours', '受付時間')}
            </h4>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('admin.settings.openTime', '開始時間')}
              </label>
              <input
                type="time"
                value={localSettings.openTime || ''}
                onChange={(e) => setLocalSettings({ ...localSettings, openTime: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('admin.settings.closeTime', '終了時間')}
              </label>
              <input
                type="time"
                value={localSettings.closeTime || ''}
                onChange={(e) => setLocalSettings({ ...localSettings, closeTime: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* プログラム選択設定 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-purple-100 p-3 dark:bg-purple-900/30">
              <Hash className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="font-semibold text-slate-900 dark:text-white">
              {t('admin.settings.selectionSettings', 'プログラム選択設定')}
            </h4>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('admin.settings.maxSelections', '最大選択数')}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={5}
                value={localSettings.maxSelections || 3}
                onChange={(e) => setLocalSettings({ ...localSettings, maxSelections: parseInt(e.target.value) })}
                className="flex-1 accent-brand-500"
              />
              <span className="w-12 rounded-lg bg-slate-100 px-3 py-2 text-center font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {localSettings.maxSelections || 3}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              {t('admin.settings.maxSelectionsHint', '来場者が選択できるプログラムの最大数')}
            </p>
          </div>
        </div>

        {/* ウェルカムメッセージ */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-900/30">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-semibold text-slate-900 dark:text-white">
              {t('admin.settings.welcomeMessage', 'ウェルカムメッセージ')}
            </h4>
          </div>
          <div>
            <textarea
              value={localSettings.welcomeMessage || ''}
              onChange={(e) => setLocalSettings({ ...localSettings, welcomeMessage: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              rows={3}
              placeholder={t('admin.settings.welcomeMessagePlaceholder', '受付画面に表示するメッセージを入力...')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
