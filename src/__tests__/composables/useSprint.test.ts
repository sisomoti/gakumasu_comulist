import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSprint } from '../../composables/useSprint'
import type { IStorageService } from '../../services/interfaces/IStorageService'
import { READING_PLAN_STORAGE_KEYS } from '../../types/storage'
import type { Sprint } from '../../types/domain/sprint'

const STORAGE_KEY = READING_PLAN_STORAGE_KEYS.sprint

function createSprint(overrides: Partial<Sprint> = {}): Sprint {
  return {
    id: 'sprint-1',
    startDate: '2025-01-01',
    endDate: '2025-01-07',
    targetPeriod: '1week',
    isActive: true,
    storyIds: ['story-1', 'story-2'],
    ...overrides,
  }
}

function storedSprint(sprint: Sprint | null): string {
  return JSON.stringify({ activeSprint: sprint })
}

describe('useSprint', () => {
  let mockStorageService: IStorageService

  beforeEach(() => {
    mockStorageService = {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }
  })

  describe('activeSprint / loadSprint', () => {
    it('ストレージが空の場合は activeSprint が null', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { activeSprint } = useSprint(mockStorageService)

      expect(activeSprint.value).toBeNull()
    })

    it('ストレージからスプリントを読み込める', () => {
      const sprint = createSprint()
      vi.mocked(mockStorageService.get).mockReturnValue(storedSprint(sprint))
      const { activeSprint } = useSprint(mockStorageService)

      expect(activeSprint.value).not.toBeNull()
      expect(activeSprint.value?.id).toBe('sprint-1')
      expect(activeSprint.value?.startDate).toBe('2025-01-01')
      expect(activeSprint.value?.isActive).toBe(true)
      expect(activeSprint.value?.storyIds).toEqual(['story-1', 'story-2'])
    })

    it('無効なJSONの場合は activeSprint が null', () => {
      vi.mocked(mockStorageService.get).mockReturnValue('invalid json')
      const { activeSprint } = useSprint(mockStorageService)

      expect(activeSprint.value).toBeNull()
    })

    it('loadSprint で再読み込みできる', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { activeSprint, loadSprint } = useSprint(mockStorageService)
      expect(activeSprint.value).toBeNull()

      const sprint = createSprint()
      vi.mocked(mockStorageService.get).mockReturnValue(storedSprint(sprint))
      loadSprint()

      expect(activeSprint.value?.id).toBe('sprint-1')
    })
  })

  describe('startSprint', () => {
    it('新規スプリントを開始できる', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { startSprint, activeSprint } = useSprint(mockStorageService)

      startSprint({
        startDate: '2025-03-01',
        endDate: '2025-03-07',
        targetPeriod: '1week',
        storyIds: ['story-a'],
      })

      expect(activeSprint.value).not.toBeNull()
      expect(activeSprint.value?.startDate).toBe('2025-03-01')
      expect(activeSprint.value?.endDate).toBe('2025-03-07')
      expect(activeSprint.value?.targetPeriod).toBe('1week')
      expect(activeSprint.value?.isActive).toBe(true)
      expect(activeSprint.value?.storyIds).toEqual(['story-a'])
      expect(activeSprint.value?.id).toBeDefined()
      expect(typeof activeSprint.value?.id).toBe('string')
      expect(mockStorageService.set).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('"startDate":"2025-03-01"')
      )
    })

    it('storyIds を省略した場合は空配列で開始', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { startSprint, activeSprint } = useSprint(mockStorageService)

      startSprint({
        startDate: '2025-03-01',
        endDate: null,
        targetPeriod: 'none',
      })

      expect(activeSprint.value?.storyIds).toEqual([])
    })

    it('既存のアクティブスプリントがある場合は上書きする', () => {
      const existing = createSprint({ id: 'old-sprint' })
      vi.mocked(mockStorageService.get).mockReturnValue(storedSprint(existing))
      const { startSprint, activeSprint } = useSprint(mockStorageService)

      startSprint({
        startDate: '2025-04-01',
        endDate: '2025-04-14',
        targetPeriod: '2weeks',
      })

      expect(activeSprint.value?.id).not.toBe('old-sprint')
      expect(activeSprint.value?.startDate).toBe('2025-04-01')
    })
  })

  describe('endSprint', () => {
    it('アクティブスプリントの isActive を false にする', () => {
      const sprint = createSprint({ isActive: true })
      vi.mocked(mockStorageService.get).mockReturnValue(storedSprint(sprint))
      const { endSprint, activeSprint } = useSprint(mockStorageService)

      endSprint()

      expect(activeSprint.value?.isActive).toBe(false)
      expect(activeSprint.value?.id).toBe('sprint-1')
      expect(mockStorageService.set).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('"isActive":false')
      )
    })

    it('アクティブスプリントがない場合は何もしない', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { endSprint, activeSprint } = useSprint(mockStorageService)

      endSprint()

      expect(activeSprint.value).toBeNull()
      expect(mockStorageService.set).not.toHaveBeenCalled()
    })
  })

  describe('modifySprint', () => {
    it('開始日・終了日・目標期間を更新できる', () => {
      const sprint = createSprint()
      vi.mocked(mockStorageService.get).mockReturnValue(storedSprint(sprint))
      const { modifySprint, activeSprint } = useSprint(mockStorageService)

      modifySprint({
        startDate: '2025-02-01',
        endDate: '2025-02-14',
        targetPeriod: '2weeks',
      })

      expect(activeSprint.value?.startDate).toBe('2025-02-01')
      expect(activeSprint.value?.endDate).toBe('2025-02-14')
      expect(activeSprint.value?.targetPeriod).toBe('2weeks')
      expect(mockStorageService.set).toHaveBeenCalled()
    })

    it('一部のフィールドだけ更新できる', () => {
      const sprint = createSprint({ startDate: '2025-01-01', endDate: '2025-01-07' })
      vi.mocked(mockStorageService.get).mockReturnValue(storedSprint(sprint))
      const { modifySprint, activeSprint } = useSprint(mockStorageService)

      modifySprint({ endDate: '2025-01-14' })

      expect(activeSprint.value?.startDate).toBe('2025-01-01')
      expect(activeSprint.value?.endDate).toBe('2025-01-14')
    })

    it('アクティブスプリントがない場合は何もしない', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { modifySprint, activeSprint } = useSprint(mockStorageService)

      modifySprint({ startDate: '2025-01-01' })

      expect(activeSprint.value).toBeNull()
      expect(mockStorageService.set).not.toHaveBeenCalled()
    })
  })

  describe('addStoriesToSprint', () => {
    it('ストーリーを追加できる（マージ）', () => {
      const sprint = createSprint({ storyIds: ['story-1'] })
      vi.mocked(mockStorageService.get).mockReturnValue(storedSprint(sprint))
      const { addStoriesToSprint, activeSprint } = useSprint(mockStorageService)

      addStoriesToSprint(['story-2', 'story-3'])

      expect(activeSprint.value?.storyIds).toEqual(['story-1', 'story-2', 'story-3'])
      expect(mockStorageService.set).toHaveBeenCalled()
    })

    it('既に含まれる storyId は重複して追加しない', () => {
      const sprint = createSprint({ storyIds: ['story-1', 'story-2'] })
      vi.mocked(mockStorageService.get).mockReturnValue(storedSprint(sprint))
      const { addStoriesToSprint, activeSprint } = useSprint(mockStorageService)

      addStoriesToSprint(['story-2', 'story-3', 'story-1'])

      expect(activeSprint.value?.storyIds).toEqual(['story-1', 'story-2', 'story-3'])
    })

    it('すべて既存と重複する場合は保存しない（変更なし）', () => {
      const sprint = createSprint({ storyIds: ['story-1', 'story-2'] })
      vi.mocked(mockStorageService.get).mockReturnValue(storedSprint(sprint))
      const setCallsBefore = vi.mocked(mockStorageService.set).mock.calls.length
      const { addStoriesToSprint, activeSprint } = useSprint(mockStorageService)

      addStoriesToSprint(['story-1', 'story-2'])

      expect(activeSprint.value?.storyIds).toEqual(['story-1', 'story-2'])
      expect(mockStorageService.set).not.toHaveBeenCalled()
    })

    it('アクティブスプリントがない場合は何もしない', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { addStoriesToSprint, activeSprint } = useSprint(mockStorageService)

      addStoriesToSprint(['story-1'])

      expect(activeSprint.value).toBeNull()
      expect(mockStorageService.set).not.toHaveBeenCalled()
    })
  })

  describe('保存に失敗した場合', () => {
    it('startSprint で保存に失敗した場合、エラーを投げる', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const error = new Error('Storage error')
      vi.mocked(mockStorageService.set).mockImplementation(() => {
        throw error
      })
      const { startSprint } = useSprint(mockStorageService)

      expect(() =>
        startSprint({
          startDate: '2025-01-01',
          endDate: null,
          targetPeriod: 'none',
        })
      ).toThrow(error)
    })
  })
})
