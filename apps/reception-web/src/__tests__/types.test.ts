import { describe, test, expect } from 'vitest'
import {
  programSchema,
  reservationSchema,
  assignedProgramSchema,
  assignmentSchema,
  receptionSettingsSchema,
} from '@/features/admin/types'

describe('Admin Types - Zod Schema Validation', () => {
  describe('programSchema', () => {
    test('validates a valid program', () => {
      const result = programSchema.safeParse({
        id: 'prog-1',
        title: 'AI Lab',
        description: 'Learn about AI',
        capacity: 20,
        remaining: 15,
        isActive: true,
        order: 0,
      })
      expect(result.success).toBe(true)
    })

    test('rejects empty title', () => {
      const result = programSchema.safeParse({
        id: 'prog-1',
        title: '',
        description: 'desc',
        capacity: 20,
        remaining: 15,
      })
      expect(result.success).toBe(false)
    })

    test('rejects negative remaining', () => {
      const result = programSchema.safeParse({
        id: 'prog-1',
        title: 'Test',
        description: 'desc',
        capacity: 20,
        remaining: -1,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('reservationSchema', () => {
    test('validates a complete reservation', () => {
      const result = reservationSchema.safeParse({
        id: 'rec-1',
        attendee: {
          name: 'テスト太郎',
          furigana: 'テストタロウ',
          grade: 'grade3',
          companions: 0,
          reserved: false,
        },
        selections: [{ id: 'prog-1', title: 'AI Lab' }],
        status: 'waiting',
        createdAt: '2024-01-01T00:00:00Z',
      })
      expect(result.success).toBe(true)
    })

    test('validates reservation with assignedProgram', () => {
      const result = reservationSchema.safeParse({
        id: 'rec-1',
        attendee: {
          name: 'テスト太郎',
          furigana: 'テストタロウ',
          grade: 'grade3',
          companions: 0,
          reserved: false,
        },
        selections: [{ id: 'prog-1', title: 'AI Lab' }],
        assignedProgram: {
          id: 'prog-1',
          title: 'AI Lab',
          priority: 1,
          assignedAt: '2024-01-01T00:00:00Z',
          assignedBy: 'auto',
        },
        status: 'assigned',
        createdAt: '2024-01-01T00:00:00Z',
      })
      expect(result.success).toBe(true)
    })

    test('validates reservation with null assignedProgram', () => {
      const result = reservationSchema.safeParse({
        id: 'rec-1',
        attendee: {
          name: 'テスト太郎',
          furigana: 'テストタロウ',
          grade: 'grade3',
          companions: 0,
          reserved: false,
        },
        selections: [],
        assignedProgram: null,
        status: 'waiting',
        createdAt: '2024-01-01T00:00:00Z',
      })
      expect(result.success).toBe(true)
    })

    test('accepts all valid status values', () => {
      const statuses = ['waiting', 'assigned', 'completed', 'cancelled'] as const
      for (const status of statuses) {
        const result = reservationSchema.safeParse({
          id: 'rec-1',
          attendee: {
            name: 'テスト',
            furigana: 'テスト',
            grade: 'grade1',
            companions: 0,
            reserved: false,
          },
          selections: [],
          status,
          createdAt: '2024-01-01T00:00:00Z',
        })
        expect(result.success).toBe(true)
      }
    })

    test('rejects invalid status', () => {
      const result = reservationSchema.safeParse({
        id: 'rec-1',
        attendee: {
          name: 'テスト',
          furigana: 'テスト',
          grade: 'grade1',
          companions: 0,
          reserved: false,
        },
        selections: [],
        status: 'invalid_status',
        createdAt: '2024-01-01T00:00:00Z',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('assignedProgramSchema', () => {
    test('validates auto assignment', () => {
      const result = assignedProgramSchema.safeParse({
        id: 'prog-1',
        title: 'AI Lab',
        priority: 1,
        assignedAt: '2024-01-01T00:00:00Z',
        assignedBy: 'auto',
      })
      expect(result.success).toBe(true)
    })

    test('validates manual assignment', () => {
      const result = assignedProgramSchema.safeParse({
        id: 'prog-1',
        title: 'AI Lab',
        priority: 2,
        assignedAt: '2024-01-01T00:00:00Z',
        assignedBy: 'manual',
      })
      expect(result.success).toBe(true)
    })

    test('rejects invalid assignedBy', () => {
      const result = assignedProgramSchema.safeParse({
        id: 'prog-1',
        title: 'AI Lab',
        priority: 1,
        assignedAt: '2024-01-01T00:00:00Z',
        assignedBy: 'unknown',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('assignmentSchema', () => {
    test('validates a confirmed assignment', () => {
      const result = assignmentSchema.safeParse({
        id: 'assign-1',
        receptionId: 'rec-1',
        programId: 'prog-1',
        attendeeName: 'テスト太郎',
        priority: 1,
        status: 'confirmed',
        assignedAt: '2024-01-01T00:00:00Z',
      })
      expect(result.success).toBe(true)
    })

    test('validates a cancelled assignment', () => {
      const result = assignmentSchema.safeParse({
        id: 'assign-1',
        receptionId: 'rec-1',
        programId: 'prog-1',
        attendeeName: 'テスト太郎',
        priority: 1,
        status: 'cancelled',
        assignedAt: '2024-01-01T00:00:00Z',
        cancelledAt: '2024-01-02T00:00:00Z',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('receptionSettingsSchema', () => {
    test('validates with defaults', () => {
      const result = receptionSettingsSchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isOpen).toBe(true)
        expect(result.data.maxSelections).toBe(3)
        expect(result.data.eventName).toBe('オープンキャンパス')
      }
    })

    test('rejects maxSelections above 5', () => {
      const result = receptionSettingsSchema.safeParse({
        maxSelections: 10,
      })
      expect(result.success).toBe(false)
    })
  })
})
