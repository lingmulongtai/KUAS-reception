import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Search, 
  Pencil, 
  Trash2, 
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useReservations } from '../hooks/useReservations'
import { usePrograms } from '../hooks/useAdminPrograms'
import type { Reservation } from '../types'

type StatusFilter = 'all' | 'waiting' | 'completed' | 'cancelled'

export function ReservationManager() {
  const { t } = useTranslation()
  const { reservations, loading, updateReservation, deleteReservation } = useReservations()
  const { programs } = usePrograms()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editSelections, setEditSelections] = useState<Array<{ id: string; title: string }>>([])

  const filteredReservations = reservations.filter((r) => {
    const matchesSearch = 
      r.attendee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.attendee.furigana.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.attendee.school && r.attendee.school.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleStatusChange = async (id: string, status: Reservation['status']) => {
    await updateReservation(id, { status })
  }

  const handleDelete = async (id: string) => {
    if (window.confirm(t('admin.reservations.confirmDelete', 'この予約を削除しますか？'))) {
      await deleteReservation(id)
    }
  }

  const handleEditSelections = (reservation: Reservation) => {
    setEditingId(reservation.id)
    setEditSelections([...reservation.selections])
  }

  const handleSaveSelections = async () => {
    if (editingId) {
      await updateReservation(editingId, { selections: editSelections })
      setEditingId(null)
      setEditSelections([])
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditSelections([])
  }

  const toggleProgramSelection = (programId: string, programTitle: string) => {
    const exists = editSelections.find((s) => s.id === programId)
    if (exists) {
      setEditSelections(editSelections.filter((s) => s.id !== programId))
    } else if (editSelections.length < 3) {
      setEditSelections([...editSelections, { id: programId, title: programTitle }])
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting': return <Clock className="h-4 w-4 text-amber-500" />
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case 'cancelled': return <XCircle className="h-4 w-4 text-slate-400" />
      default: return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'waiting': return t('admin.reservations.status.waiting', '待機中')
      case 'completed': return t('admin.reservations.status.completed', '完了')
      case 'cancelled': return t('admin.reservations.status.cancelled', 'キャンセル')
      default: return status
    }
  }

  const getGradeLabel = (grade: string) => {
    const labels: Record<string, string> = {
      grade1: t('attendeeForm.gradeOptions.grade1', '高校1年生'),
      grade2: t('attendeeForm.gradeOptions.grade2', '高校2年生'),
      grade3: t('attendeeForm.gradeOptions.grade3', '高校3年生'),
      other: t('attendeeForm.gradeOptions.other', 'その他'),
    }
    return labels[grade] || grade
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
      {/* 検索とフィルター */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            placeholder={t('admin.reservations.searchPlaceholder', '名前、フリガナ、学校名で検索...')}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'waiting', 'completed', 'cancelled'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
            >
              {status === 'all' ? t('admin.reservations.filter.all', 'すべて') : getStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {/* 予約一覧 */}
      <div className="space-y-2">
        {filteredReservations.map((reservation) => (
          <div
            key={reservation.id}
            className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-800"
          >
            {/* メインの行 */}
            <div
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
              onClick={() => setExpandedId(expandedId === reservation.id ? null : reservation.id)}
            >
              <div className="flex-shrink-0">
                {getStatusIcon(reservation.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {reservation.attendee.name}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ({reservation.attendee.furigana})
                  </span>
                  {reservation.attendee.reserved && (
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                      {t('admin.reservations.reserved', '事前予約')}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  {reservation.attendee.school && (
                    <span>{reservation.attendee.school}</span>
                  )}
                  <span>・</span>
                  <span>{getGradeLabel(reservation.attendee.grade)}</span>
                  {reservation.attendee.companions > 0 && (
                    <>
                      <span>・</span>
                      <span>{t('admin.reservations.companions', '同伴者')}: {reservation.attendee.companions}{t('attendeeForm.companionsUnit', '名')}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">
                  {reservation.selections.length}{t('admin.reservations.programs', 'プログラム')}
                </span>
                {expandedId === reservation.id ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </div>
            </div>

            {/* 展開された詳細 */}
            {expandedId === reservation.id && (
              <div className="border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                {/* 選択されたプログラム */}
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t('admin.reservations.selectedPrograms', '選択プログラム')}
                    </span>
                    {editingId !== reservation.id && (
                      <button
                        type="button"
                        onClick={() => handleEditSelections(reservation)}
                        className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400"
                      >
                        <Pencil className="h-3 w-3" />
                        {t('admin.reservations.editPrograms', '変更')}
                      </button>
                    )}
                  </div>

                  {editingId === reservation.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {programs.filter(p => p.isActive).map((program) => {
                          const isSelected = editSelections.some((s) => s.id === program.id)
                          const selectionIndex = editSelections.findIndex((s) => s.id === program.id)
                          return (
                            <button
                              key={program.id}
                              type="button"
                              onClick={() => toggleProgramSelection(program.id, program.title)}
                              className={`relative rounded-lg border p-3 text-left text-sm transition-all ${
                                isSelected
                                  ? 'border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-900/20'
                                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:hover:border-slate-500'
                              }`}
                            >
                              {isSelected && (
                                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                                  {selectionIndex + 1}
                                </span>
                              )}
                              <span className={isSelected ? 'text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-300'}>
                                {program.title}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                          <X className="h-4 w-4" />
                          <span>{t('common.actions.cancel', 'キャンセル')}</span>
                        </Button>
                        <Button size="sm" onClick={handleSaveSelections}>
                          <Check className="h-4 w-4" />
                          <span>{t('common.actions.save', '保存')}</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {reservation.selections.map((selection, index) => (
                        <span
                          key={selection.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700"
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                            {index + 1}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">{selection.title}</span>
                        </span>
                      ))}
                      {reservation.selections.length === 0 && (
                        <span className="text-sm text-slate-400">{t('admin.reservations.noPrograms', 'プログラム未選択')}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* アクションボタン */}
                <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-700">
                  <div className="flex gap-2">
                    {reservation.status !== 'completed' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleStatusChange(reservation.id, 'completed')}
                        className="gap-1"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>{t('admin.reservations.markComplete', '完了にする')}</span>
                      </Button>
                    )}
                    {reservation.status !== 'waiting' && reservation.status !== 'cancelled' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleStatusChange(reservation.id, 'waiting')}
                        className="gap-1"
                      >
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span>{t('admin.reservations.markWaiting', '待機中に戻す')}</span>
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(reservation.id)}
                    className="gap-1 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{t('admin.reservations.delete', '削除')}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredReservations.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
            <User className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {searchQuery || statusFilter !== 'all'
                ? t('admin.reservations.noResults', '条件に一致する予約がありません')
                : t('admin.reservations.empty', '予約がありません')
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
