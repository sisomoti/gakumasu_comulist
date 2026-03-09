import { describe, it, expect } from 'vitest'
import { getSprintDurationDays } from '../../utils/sprintUtils'
import type { Sprint } from '../../types/domain/sprint'

describe('sprintUtils', () => {
  describe('getSprintDurationDays', () => {
    it('null の場合は null', () => {
      expect(getSprintDurationDays(null)).toBeNull()
    })

    it('endDate が null の場合は null', () => {
      const sprint: Sprint = {
        id: 'x',
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: null,
        targetPeriod: 'none',
        isActive: true,
        storyIds: [],
      }
      expect(getSprintDurationDays(sprint)).toBeNull()
    })

    it('開始と終了が同じ日なら 1 日', () => {
      const sprint: Sprint = {
        id: 'x',
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-01T23:59:59.999Z',
        targetPeriod: '1week',
        isActive: true,
        storyIds: [],
      }
      expect(getSprintDurationDays(sprint)).toBe(1)
    })

    it('7日間のスプリントなら 7', () => {
      const sprint: Sprint = {
        id: 'x',
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-08T00:00:00.000Z',
        targetPeriod: '1week',
        isActive: true,
        storyIds: [],
      }
      expect(getSprintDurationDays(sprint)).toBe(7)
    })
  })
})
