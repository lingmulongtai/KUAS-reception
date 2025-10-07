import { z } from 'zod'

export const attendeeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'お名前を入力してください'),
  furigana: z.string().min(1, 'フリガナを入力してください'),
  school: z.string().optional(),
  grade: z.enum(['高校1年生', '高校2年生', '高校3年生', 'その他']),
  companions: z.number().int().min(0).max(5),
  reserved: z.boolean(),
})

export const programChoiceSchema = z.object({
  id: z.string(),
  title: z.string(),
  capacity: z.number().int().nonnegative(),
  remaining: z.number().int().nonnegative(),
  description: z.string().optional(),
})

export const receptionFormSchema = z.object({
  attendee: attendeeSchema,
  selections: z.array(programChoiceSchema.pick({ id: true, title: true })).max(3),
  notes: z.string().max(300).optional(),
})

export type Attendee = z.infer<typeof attendeeSchema>
export type ProgramChoice = z.infer<typeof programChoiceSchema>
export type ReceptionForm = z.infer<typeof receptionFormSchema>
