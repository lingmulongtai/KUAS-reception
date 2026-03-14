import { z } from 'zod'

// プログラム設定スキーマ
export const programSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string(),
  capacity: z.number().int().min(1),
  remaining: z.number().int().min(0),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  isActive: z.boolean().default(true),
  order: z.number().int().default(0),
})

// 割当プログラムスキーマ
export const assignedProgramSchema = z.object({
  id: z.string(),
  title: z.string(),
  priority: z.number(),
  assignedAt: z.string(),
  assignedBy: z.enum(["auto", "manual"]),
})

// 予約レコードスキーマ
export const reservationSchema = z.object({
  id: z.string(),
  attendee: z.object({
    name: z.string(),
    furigana: z.string(),
    school: z.string().optional(),
    grade: z.enum(['grade1', 'grade2', 'grade3', 'other']),
    companions: z.number().int().min(0),
    reserved: z.boolean(),
  }),
  selections: z.array(z.object({
    id: z.string(),
    title: z.string(),
  })),
  assignedProgram: assignedProgramSchema.nullable().optional(),
  status: z.enum(['waiting', 'assigned', 'completed', 'cancelled']),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  notes: z.string().optional(),
})

// 割当レコードスキーマ
export const assignmentSchema = z.object({
  id: z.string(),
  receptionId: z.string(),
  programId: z.string(),
  attendeeName: z.string(),
  priority: z.number(),
  status: z.enum(['confirmed', 'cancelled']),
  assignedAt: z.string(),
  cancelledAt: z.string().optional(),
})

// 受付設定スキーマ
export const receptionSettingsSchema = z.object({
  isOpen: z.boolean().default(true),
  maxSelections: z.number().int().min(1).max(5).default(3),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  eventName: z.string().default('オープンキャンパス'),
  eventDate: z.string().optional(),
  welcomeMessage: z.string().optional(),
})

export type Program = z.infer<typeof programSchema>
export type AssignedProgram = z.infer<typeof assignedProgramSchema>
export type Reservation = z.infer<typeof reservationSchema>
export type Assignment = z.infer<typeof assignmentSchema>
export type ReceptionSettings = z.infer<typeof receptionSettingsSchema>

// 管理者ユーザー
export interface AdminUser {
  uid: string
  email: string | null
  displayName: string | null
}

// 管理パネルのタブ
export type AdminTab = 'reservations' | 'programs' | 'assignments' | 'settings'

// 受付結果 (API レスポンス)
export interface ReceptionResult {
  id: string
  assignedProgram: AssignedProgram | null
  waitlisted: boolean
}
