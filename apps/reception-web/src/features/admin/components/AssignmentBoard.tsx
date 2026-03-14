import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users,
  Clock,
  UserCheck,
  XCircle,
  Loader2,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { listenReservations, listenPrograms } from '@/services/firebase'
import { apiClient } from '@/services/api'
import type { Reservation, Program, Assignment } from '../types'
import { listenAssignments } from '@/services/firebase'

export function AssignmentBoard() {
  const { t } = useTranslation()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [assigningPair, setAssigningPair] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    let loadCount = 0
    const checkLoaded = () => {
      loadCount++
      if (loadCount >= 3) setLoading(false)
    }

    const unsubReservations = listenReservations((items) => {
      setReservations(items)
      checkLoaded()
    })

    const unsubPrograms = listenPrograms((items) => {
      setPrograms(items)
      checkLoaded()
    })

    const unsubAssignments = listenAssignments((items) => {
      setAssignments(items)
      checkLoaded()
    })

    return () => {
      unsubReservations()
      unsubPrograms()
      unsubAssignments()
    }
  }, [])

  const waitingReservations = reservations.filter((r) => r.status === 'waiting')
  const assignedReservations = reservations.filter((r) => r.status === 'assigned')
  const activeAssignments = assignments.filter((a) => a.status === 'confirmed')

  const handleManualAssign = async (receptionId: string, programId: string) => {
    const key = `${receptionId}-${programId}`
    setAssigningPair(key)
    try {
      await apiClient.post('/assignments/manual', { receptionId, programId })
    } catch (error) {
      console.error('Manual assignment failed:', error)
      alert(error instanceof Error ? error.message : t('admin.assignments.assignError', '割当に失敗しました'))
    } finally {
      setAssigningPair(null)
    }
  }

  const handleCancelAssignment = async (assignmentId: string) => {
    if (!window.confirm(t('admin.assignments.confirmCancel', 'この割当をキャンセルしますか？待機者がいる場合、自動で繰り上げされます。'))) {
      return
    }
    setCancellingId(assignmentId)
    try {
      const result = await apiClient.post<{
        cancelled: { assignmentId: string; receptionId: string }
        promoted: { receptionId: string; attendeeName: string } | null
      }>(`/assignments/${assignmentId}/cancel`, {})
      if (result.promoted) {
        alert(t('admin.assignments.promoted', '{{name}} さんが繰り上げ割当されました', { name: result.promoted.attendeeName }))
      }
    } catch (error) {
      console.error('Cancel assignment failed:', error)
      alert(error instanceof Error ? error.message : t('admin.assignments.cancelError', 'キャンセルに失敗しました'))
    } finally {
      setCancellingId(null)
    }
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
      {/* サマリーカード */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {t('admin.assignments.waitingCount', '待機中')}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-800 dark:text-amber-200">
            {waitingReservations.length}
          </p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {t('admin.assignments.assignedCount', '割当済')}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-800 dark:text-blue-200">
            {assignedReservations.length}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              {t('admin.assignments.activeAssignments', '有効な割当')}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-800 dark:text-emerald-200">
            {activeAssignments.length}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左カラム: 待機中の来場者 */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Clock className="h-4 w-4 text-amber-500" />
            {t('admin.assignments.waitingList', '待機者リスト')}
          </h3>
          <div className="space-y-2">
            {waitingReservations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-600">
                <p className="text-sm text-slate-400">
                  {t('admin.assignments.noWaiting', '待機中の来場者はいません')}
                </p>
              </div>
            ) : (
              waitingReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {reservation.attendee.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {reservation.attendee.companions > 0
                          ? t('admin.assignments.withCompanions', '{{count}}名の同伴者あり', { count: reservation.attendee.companions })
                          : t('admin.assignments.noCompanions', '同伴者なし')
                        }
                      </p>
                    </div>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {t('admin.assignments.desiredPrograms', '希望プログラム:')}
                    </p>
                    {reservation.selections.map((sel, idx) => {
                      const program = programs.find((p) => p.id === sel.id)
                      const hasSeats = program && program.remaining > 0
                      return (
                        <div
                          key={sel.id}
                          className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-1.5 dark:bg-slate-700"
                        >
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                              {idx + 1}
                            </span>
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {sel.title}
                            </span>
                            {program && (
                              <span className={`text-xs ${hasSeats ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                ({program.remaining}/{program.capacity})
                              </span>
                            )}
                          </div>
                          {hasSeats && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleManualAssign(reservation.id, sel.id)}
                              loading={assigningPair === `${reservation.id}-${sel.id}`}
                              className="h-7 gap-1 px-2 text-xs"
                            >
                              <ArrowRight className="h-3 w-3" />
                              <span>{t('admin.assignments.assign', '割当')}</span>
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 右カラム: プログラム別状況 */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Users className="h-4 w-4 text-blue-500" />
            {t('admin.assignments.programStatus', 'プログラム別状況')}
          </h3>
          <div className="space-y-2">
            {programs.filter(p => p.isActive).map((program) => {
              const programAssignments = activeAssignments.filter(
                (a) => a.programId === program.id
              )
              const usedSeats = program.capacity - program.remaining
              const fillPercent = program.capacity > 0 ? (usedSeats / program.capacity) * 100 : 0

              return (
                <div
                  key={program.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {program.title}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      program.remaining === 0
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                        : program.remaining <= 3
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    }`}>
                      {t('admin.assignments.seatsInfo', '残 {{remaining}}/{{capacity}}', {
                        remaining: program.remaining,
                        capacity: program.capacity,
                      })}
                    </span>
                  </div>

                  {/* 席の使用率バー */}
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className={`h-full rounded-full transition-all ${
                        fillPercent >= 90
                          ? 'bg-rose-500'
                          : fillPercent >= 70
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                      }`}
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>

                  {/* このプログラムの割当者リスト */}
                  {programAssignments.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {programAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 dark:bg-slate-700"
                        >
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-3 w-3 text-blue-500" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {assignment.attendeeName}
                            </span>
                            <span className="text-xs text-slate-400">
                              ({t('admin.assignments.priorityLabel', '第{{n}}希望', { n: assignment.priority })})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCancelAssignment(assignment.id)}
                            disabled={cancellingId === assignment.id}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                          >
                            {cancellingId === assignment.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            <span>{t('admin.assignments.cancel', 'キャンセル')}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
