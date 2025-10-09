import { z } from 'zod'
import i18n from '@/i18n'

export const attendeeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, i18n.t('validation.attendee.nameRequired')),
  furigana: z.string().min(1, i18n.t('validation.attendee.furiganaRequired')),
  school: z.string().optional(),
  grade: z.enum(['grade1', 'grade2', 'grade3', 'other']),
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
