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
  status: z.enum(['waiting', 'completed', 'cancelled']),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  notes: z.string().optional(),
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
export type Reservation = z.infer<typeof reservationSchema>
export type ReceptionSettings = z.infer<typeof receptionSettingsSchema>

// 管理者ユーザー
export interface AdminUser {
  uid: string
  email: string | null
  displayName: string | null
}

// 管理パネルのタブ
export type AdminTab = 'reservations' | 'programs' | 'settings'
