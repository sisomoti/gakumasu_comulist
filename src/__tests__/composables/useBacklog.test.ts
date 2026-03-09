import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useBacklog } from '../../composables/useBacklog'
import type { IStorageService } from '../../services/interfaces/IStorageService'
import { READING_PLAN_STORAGE_KEYS } from '../../types/storage'
import type { BacklogItem, BacklogFilter } from '../../types/domain/backlog'

const STORAGE_KEY = READING_PLAN_STORAGE_KEYS.backlog

function createItem(overrides: Partial<BacklogItem> = {}): BacklogItem {
  return {
    storyId: 'story-1',
    rank: 0,
    section: 'sprintBacklog',
    ...overrides,
  }
}

function storedBacklog(data: {
  items: BacklogItem[]
  filter: BacklogFilter
  lastUpdated?: string
}): string {
  return JSON.stringify({
    items: data.items,
    filter: data.filter,
    lastUpdated: data.lastUpdated ?? new Date().toISOString(),
  })
}

describe('useBacklog', () => {
  let mockStorageService: IStorageService

  beforeEach(() => {
    mockStorageService = {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }
  })

  describe('items / filter / loadBacklog', () => {
    it('ストレージが空の場合は items が空・filter が空オブジェクト', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { items, filter } = useBacklog(mockStorageService)

      expect(items.value).toEqual([])
      expect(filter.value).toEqual({})
    })

    it('ストレージからバックログを読み込める', () => {
      const itemsData = [
        createItem({ storyId: 'story-a', rank: 0, section: 'sprintBacklog' }),
        createItem({ storyId: 'story-b', rank: 1, section: 'productBacklog' }),
      ]
      vi.mocked(mockStorageService.get).mockReturnValue(
        storedBacklog({ items: itemsData, filter: { unreadOnly: true } })
      )
      const { items, filter } = useBacklog(mockStorageService)

      expect(items.value).toHaveLength(2)
      expect(items.value[0].storyId).toBe('story-a')
      expect(items.value[0].section).toBe('sprintBacklog')
      expect(items.value[1].storyId).toBe('story-b')
      expect(items.value[1].section).toBe('productBacklog')
      expect(filter.value).toEqual({ unreadOnly: true })
    })

    it('無効なJSONの場合は items が空・filter が空オブジェクト', () => {
      vi.mocked(mockStorageService.get).mockReturnValue('invalid json')
      const { items, filter } = useBacklog(mockStorageService)

      expect(items.value).toEqual([])
      expect(filter.value).toEqual({})
    })

    it('loadBacklog で再読み込みできる', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { items, loadBacklog } = useBacklog(mockStorageService)
      expect(items.value).toEqual([])

      const itemsData = [createItem({ storyId: 'story-x' })]
      vi.mocked(mockStorageService.get).mockReturnValue(
        storedBacklog({ items: itemsData, filter: {} })
      )
      loadBacklog()

      expect(items.value).toHaveLength(1)
      expect(items.value[0].storyId).toBe('story-x')
    })
  })

  describe('setFilter / clearFilter', () => {
    it('setFilter でフィルターを部分更新し保存する', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { setFilter, filter } = useBacklog(mockStorageService)

      setFilter({ unreadOnly: true, sortBy: 'name' })

      expect(filter.value).toEqual({ unreadOnly: true, sortBy: 'name' })
      expect(mockStorageService.set).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('"unreadOnly":true')
      )
    })

    it('clearFilter でフィルターをクリアし保存する', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(
        storedBacklog({ items: [], filter: { sortBy: 'rarity' } })
      )
      const { clearFilter, filter } = useBacklog(mockStorageService)

      clearFilter()

      expect(filter.value).toEqual({})
      expect(mockStorageService.set).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('"filter":{}')
      )
    })
  })

  describe('setRanks', () => {
    it('指定した並び順でランクを振り直し保存する', () => {
      const itemsData = [
        createItem({ storyId: 'a', rank: 2 }),
        createItem({ storyId: 'b', rank: 0 }),
        createItem({ storyId: 'c', rank: 1 }),
      ]
      vi.mocked(mockStorageService.get).mockReturnValue(
        storedBacklog({ items: itemsData, filter: {} })
      )
      const { setRanks, items } = useBacklog(mockStorageService)

      setRanks(['c', 'a', 'b'])

      expect(items.value.find(i => i.storyId === 'c')?.rank).toBe(0)
      expect(items.value.find(i => i.storyId === 'a')?.rank).toBe(1)
      expect(items.value.find(i => i.storyId === 'b')?.rank).toBe(2)
      expect(mockStorageService.set).toHaveBeenCalled()
    })

    it('orderedStoryIds に含まれない既存アイテムは後ろに続くランクになる', () => {
      const itemsData = [
        createItem({ storyId: 'x', rank: 0 }),
        createItem({ storyId: 'y', rank: 1 }),
        createItem({ storyId: 'z', rank: 2 }),
      ]
      vi.mocked(mockStorageService.get).mockReturnValue(
        storedBacklog({ items: itemsData, filter: {} })
      )
      const { setRanks, items } = useBacklog(mockStorageService)

      setRanks(['y', 'x'])

      expect(items.value.find(i => i.storyId === 'y')?.rank).toBe(0)
      expect(items.value.find(i => i.storyId === 'x')?.rank).toBe(1)
      expect(items.value.find(i => i.storyId === 'z')?.rank).toBe(2)
    })
  })

  describe('setInSprintBacklogUpToRank', () => {
    it('指定ランク以下を sprintBacklog、それより後を productBacklog に更新する', () => {
      const itemsData = [
        createItem({ storyId: 's1', rank: 0, section: 'productBacklog' }),
        createItem({ storyId: 's2', rank: 1, section: 'productBacklog' }),
        createItem({ storyId: 's3', rank: 2, section: 'productBacklog' }),
      ]
      vi.mocked(mockStorageService.get).mockReturnValue(
        storedBacklog({ items: itemsData, filter: {} })
      )
      const { setInSprintBacklogUpToRank, items } = useBacklog(mockStorageService)

      setInSprintBacklogUpToRank(1)

      expect(items.value.find(i => i.storyId === 's1')?.section).toBe('sprintBacklog')
      expect(items.value.find(i => i.storyId === 's2')?.section).toBe('sprintBacklog')
      expect(items.value.find(i => i.storyId === 's3')?.section).toBe('productBacklog')
      expect(mockStorageService.set).toHaveBeenCalled()
    })

    it('outOfScope のアイテムは変更しない', () => {
      const itemsData = [
        createItem({ storyId: 's1', rank: 0, section: 'sprintBacklog' }),
        createItem({ storyId: 's2', rank: 1, section: 'outOfScope' }),
        createItem({ storyId: 's3', rank: 2, section: 'productBacklog' }),
      ]
      vi.mocked(mockStorageService.get).mockReturnValue(
        storedBacklog({ items: itemsData, filter: {} })
      )
      const { setInSprintBacklogUpToRank, items } = useBacklog(mockStorageService)

      setInSprintBacklogUpToRank(0)

      expect(items.value.find(i => i.storyId === 's1')?.section).toBe('sprintBacklog')
      expect(items.value.find(i => i.storyId === 's2')?.section).toBe('outOfScope')
      expect(items.value.find(i => i.storyId === 's3')?.section).toBe('productBacklog')
    })
  })

  describe('moveToOutOfScope', () => {
    it('指定ストーリーを outOfScope に移す', () => {
      const itemsData = [createItem({ storyId: 's1', rank: 0, section: 'sprintBacklog' })]
      vi.mocked(mockStorageService.get).mockReturnValue(
        storedBacklog({ items: itemsData, filter: {} })
      )
      const { moveToOutOfScope, items } = useBacklog(mockStorageService)

      moveToOutOfScope('s1')

      expect(items.value[0].section).toBe('outOfScope')
      expect(mockStorageService.set).toHaveBeenCalled()
    })

    it('対象が存在しない場合は何もしない', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { moveToOutOfScope, items } = useBacklog(mockStorageService)

      moveToOutOfScope('nonexistent')

      expect(items.value).toEqual([])
    })
  })

  describe('moveToProductBacklog', () => {
    it('指定ストーリーを productBacklog に移す', () => {
      const itemsData = [createItem({ storyId: 's1', rank: 0, section: 'sprintBacklog' })]
      vi.mocked(mockStorageService.get).mockReturnValue(
        storedBacklog({ items: itemsData, filter: {} })
      )
      const { moveToProductBacklog, items } = useBacklog(mockStorageService)

      moveToProductBacklog('s1')

      expect(items.value[0].section).toBe('productBacklog')
    })

    it('items に存在しない場合は productBacklog で新規追加する（moveToSprintBacklog と対称）', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { moveToProductBacklog, items } = useBacklog(mockStorageService)

      moveToProductBacklog('new-story')

      expect(items.value).toHaveLength(1)
      expect(items.value[0].storyId).toBe('new-story')
      expect(items.value[0].rank).toBe(0)
      expect(items.value[0].section).toBe('productBacklog')
    })
  })

  describe('moveToSprintBacklog', () => {
    it('既存アイテムの section を sprintBacklog に更新する', () => {
      const itemsData = [createItem({ storyId: 's1', rank: 0, section: 'productBacklog' })]
      vi.mocked(mockStorageService.get).mockReturnValue(
        storedBacklog({ items: itemsData, filter: {} })
      )
      const { moveToSprintBacklog, items } = useBacklog(mockStorageService)

      moveToSprintBacklog('s1')

      expect(items.value[0].section).toBe('sprintBacklog')
    })

    it('items に存在しない場合は新規追加する', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { moveToSprintBacklog, items } = useBacklog(mockStorageService)

      moveToSprintBacklog('new-story')

      expect(items.value).toHaveLength(1)
      expect(items.value[0].storyId).toBe('new-story')
      expect(items.value[0].rank).toBe(0)
      expect(items.value[0].section).toBe('sprintBacklog')
    })

    it('既存アイテムがある場合、末尾に追加する', () => {
      const itemsData = [createItem({ storyId: 's1', rank: 0, section: 'sprintBacklog' })]
      vi.mocked(mockStorageService.get).mockReturnValue(
        storedBacklog({ items: itemsData, filter: {} })
      )
      const { moveToSprintBacklog, items } = useBacklog(mockStorageService)

      moveToSprintBacklog('s2')

      expect(items.value).toHaveLength(2)
      expect(items.value[1].storyId).toBe('s2')
      expect(items.value[1].rank).toBe(1)
      expect(items.value[1].section).toBe('sprintBacklog')
    })
  })

  describe('保存に失敗した場合', () => {
    it('setFilter で保存に失敗した場合、エラーを投げる', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const error = new Error('Storage error')
      vi.mocked(mockStorageService.set).mockImplementation(() => {
        throw error
      })
      const { setFilter } = useBacklog(mockStorageService)

      expect(() => setFilter({ unreadOnly: true })).toThrow(error)
    })
  })
})
