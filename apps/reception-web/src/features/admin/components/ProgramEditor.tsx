import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Save, 
  X, 
  GripVertical,
  Users,
  Clock,
  MapPin,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui'
import { usePrograms } from '../hooks/useAdminPrograms'
import type { Program } from '../types'

export function ProgramEditor() {
  const { t } = useTranslation()
  const { programs, loading, addProgram, updateProgram, deleteProgram } = usePrograms()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<Partial<Program>>({
    title: '',
    description: '',
    capacity: 20,
    remaining: 20,
    startTime: '',
    endTime: '',
    location: '',
    isActive: true,
    order: 0,
  })

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      capacity: 20,
      remaining: 20,
      startTime: '',
      endTime: '',
      location: '',
      isActive: true,
      order: programs.length,
    })
  }

  const handleEdit = (program: Program) => {
    setEditingId(program.id)
    setForm(program)
    setIsAdding(false)
  }

  const handleAdd = () => {
    resetForm()
    setIsAdding(true)
    setEditingId(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setIsAdding(false)
    resetForm()
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (isAdding) {
        await addProgram({
          title: form.title || '',
          description: form.description || '',
          capacity: form.capacity || 20,
          remaining: form.remaining || form.capacity || 20,
          startTime: form.startTime,
          endTime: form.endTime,
          location: form.location,
          isActive: form.isActive ?? true,
          order: form.order || programs.length,
        })
      } else if (editingId) {
        await updateProgram(editingId, form)
      }
      handleCancel()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm(t('admin.programs.confirmDelete', 'このプログラムを削除しますか？'))) {
      await deleteProgram(id)
    }
  }

  const handleToggleActive = async (program: Program) => {
    await updateProgram(program.id, { isActive: !program.isActive })
  }

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
            {t('admin.programs.title', 'プログラム管理')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('admin.programs.description', 'オープンキャンパスのプログラムを追加・編集できます')}
          </p>
        </div>
        <Button onClick={handleAdd} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          <span>{t('admin.programs.add', '追加')}</span>
        </Button>
      </div>

      {/* 追加フォーム */}
      {isAdding && (
        <ProgramForm
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
          isNew
        />
      )}

      {/* プログラム一覧 */}
      <div className="space-y-3">
        {programs.map((program) => (
          <div key={program.id}>
            {editingId === program.id ? (
              <ProgramForm
                form={form}
                setForm={setForm}
                onSave={handleSave}
                onCancel={handleCancel}
                saving={saving}
              />
            ) : (
              <div
                className={`rounded-xl border p-4 transition-all ${
                  program.isActive
                    ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                    : 'border-slate-200/50 bg-slate-50/50 opacity-60 dark:border-slate-700/50 dark:bg-slate-800/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 pt-1 text-slate-300 dark:text-slate-600">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {program.title}
                      </h4>
                      {!program.isActive && (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                          {t('admin.programs.inactive', '非公開')}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                      {program.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {t('admin.programs.capacity', '定員')}: {program.remaining}/{program.capacity}
                      </span>
                      {program.startTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {program.startTime}
                          {program.endTime && ` - ${program.endTime}`}
                        </span>
                      )}
                      {program.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {program.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(program)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        program.isActive
                          ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {program.isActive ? t('admin.programs.public', '公開中') : t('admin.programs.hidden', '非公開')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(program)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(program.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {programs.length === 0 && !isAdding && (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
            <Calendar className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t('admin.programs.empty', 'プログラムがありません')}
            </p>
            <Button onClick={handleAdd} size="sm" className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              <span>{t('admin.programs.addFirst', '最初のプログラムを追加')}</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// インポートが不足しているので追加
import { Calendar } from 'lucide-react'

interface ProgramFormProps {
  form: Partial<Program>
  setForm: React.Dispatch<React.SetStateAction<Partial<Program>>>
  onSave: () => void
  onCancel: () => void
  saving: boolean
  isNew?: boolean
}

function ProgramForm({ form, setForm, onSave, onCancel, saving, isNew }: ProgramFormProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-xl border-2 border-brand-200 bg-brand-50/30 p-4 dark:border-brand-800 dark:bg-brand-900/10">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('admin.programs.form.title', 'プログラム名')} *
          </label>
          <input
            type="text"
            value={form.title || ''}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            placeholder="例: AI体験ラボ"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('admin.programs.form.description', '説明')}
          </label>
          <textarea
            value={form.description || ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            rows={2}
            placeholder="プログラムの概要を入力..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('admin.programs.form.capacity', '定員')} *
          </label>
          <input
            type="number"
            value={form.capacity || ''}
            onChange={(e) => {
              const capacity = parseInt(e.target.value) || 0
              setForm({ 
                ...form, 
                capacity,
                remaining: isNew ? capacity : form.remaining
              })
            }}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            min={1}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('admin.programs.form.remaining', '残り枠')}
          </label>
          <input
            type="number"
            value={form.remaining || ''}
            onChange={(e) => setForm({ ...form, remaining: parseInt(e.target.value) || 0 })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            min={0}
            max={form.capacity}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('admin.programs.form.startTime', '開始時間')}
          </label>
          <input
            type="time"
            value={form.startTime || ''}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('admin.programs.form.endTime', '終了時間')}
          </label>
          <input
            type="time"
            value={form.endTime || ''}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('admin.programs.form.location', '場所')}
          </label>
          <input
            type="text"
            value={form.location || ''}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            placeholder="例: 工学部3号館 1階"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
          <span>{t('common.actions.cancel', 'キャンセル')}</span>
        </Button>
        <Button 
          size="sm" 
          onClick={onSave} 
          disabled={saving || !form.title}
          className="gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{t('common.actions.save', '保存')}</span>
        </Button>
      </div>
    </div>
  )
}
