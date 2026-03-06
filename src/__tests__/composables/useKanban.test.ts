import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useKanban } from '../../composables/useKanban'
import type { IStorageService } from '../../services/interfaces/IStorageService'
import { READING_PLAN_STORAGE_KEYS } from '../../types/storage'
import type { KanbanItem } from '../../types/domain/sprint'
import type { KanbanColumnVisibility } from '../../types/storage'
import type { BacklogItem } from '../../types/domain/backlog'

const STORAGE_KEY = READING_PLAN_STORAGE_KEYS.kanban

function createKanbanItem(overrides: Partial<KanbanItem> = {}): KanbanItem {
  return {
    storyId: 'story-1',
    bucket: 'unread',
    order: 0,
    ...overrides,
  }
}

function createBacklogItem(overrides: Partial<BacklogItem> = {}): BacklogItem {
  return {
    storyId: 'story-1',
    rank: 0,
    section: 'sprintBacklog',
    ...overrides,
  }
}

function storedKanban(data: {
  items: KanbanItem[]
  sprintId: string
  lastUpdated?: string
  columnVisibility?: KanbanColumnVisibility
}): string {
  return JSON.stringify({
    items: data.items,
    sprintId: data.sprintId,
    lastUpdated: data.lastUpdated ?? new Date().toISOString(),
    columnVisibility: data.columnVisibility ?? {
      unread: true,
      inProgress: true,
      read: true,
    },
  })
}

describe('useKanban', () => {
  let mockStorageService: IStorageService

  beforeEach(() => {
    mockStorageService = {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }
  })

  describe('items / sprintId / columnVisibility / loadKanban', () => {
    it('ストレージが空の場合は初期値で読み込む', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { items, sprintId, columnVisibility } = useKanban(mockStorageService)

      expect(items.value).toEqual([])
      expect(sprintId.value).toBe('')
      expect(columnVisibility.value).toEqual({
        unread: true,
        inProgress: true,
        read: true,
      })
    })

    it('ストレージからカンバンを読み込める', () => {
      const itemsData = [
        createKanbanItem({ storyId: 'story-a', bucket: 'unread', order: 0 }),
        createKanbanItem({ storyId: 'story-b', bucket: 'in-progress', order: 0 }),
      ]
      vi.mocked(mockStorageService.get).mockReturnValue(
        storedKanban({
          items: itemsData,
          sprintId: 'sprint-1',
          columnVisibility: { unread: true, inProgress: false, read: true },
        })
      )
      const { items, sprintId, columnVisibility } = useKanban(mockStorageService)

      expect(items.value).toHaveLength(2)
      expect(items.value[0].storyId).toBe('story-a')
      expect(items.value[0].bucket).toBe('unread')
      expect(items.value[1].storyId).toBe('story-b')
      expect(sprintId.value).toBe('sprint-1')
      expect(columnVisibility.value.inProgress).toBe(false)
    })

    it('無効なJSONの場合は初期値で読み込む', () => {
      vi.mocked(mockStorageService.get).mockReturnValue('invalid json')
      const { items, sprintId } = useKanban(mockStorageService)

      expect(items.value).toEqual([])
      expect(sprintId.value).toBe('')
    })

    it('loadKanban で再読み込みできる', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { items, loadKanban } = useKanban(mockStorageService)
      expect(items.value).toEqual([])

      const itemsData = [createKanbanItem({ storyId: 'story-x' })]
      vi.mocked(mockStorageService.get).mockReturnValue(
        storedKanban({ items: itemsData, sprintId: '' })
      )
      loadKanban()

      expect(items.value).toHaveLength(1)
      expect(items.value[0].storyId).toBe('story-x')
    })
  })

  describe('moveItem', () => {
    it('指定ストーリーを別の列に移動し保存する', () => {
      const itemsData = [createKanbanItem({ storyId: 's1', bucket: 'unread', order: 0 })]
      vi.mocked(mockStorageService.get).mockReturnValue(
        storedKanban({ items: itemsData, sprintId: '' })
      )
      const { moveItem, items } = useKanban(mockStorageService)

      moveItem('s1', 'in-progress')

      expect(items.value[0].bucket).toBe('in-progress')
      expect(items.value[0].order).toBe(0)
      expect(mockStorageService.set).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('"bucket":"in-progress"')
      )
    })

    it('既読列に移動したときに onMarkRead が呼ばれる', () => {
      const itemsData = [createKanbanItem({ storyId: 's1', bucket: 'in-progress', order: 0 })]
      vi.mocked(mockStorageService.get).mockReturnValue(
        storedKanban({ items: itemsData, sprintId: '' })
      )
      const onMarkRead = vi.fn()
      const { moveItem, items } = useKanban(mockStorageService, { onMarkRead })

      moveItem('s1', 'read')

      expect(items.value[0].bucket).toBe('read')
      expect(onMarkRead).toHaveBeenCalledWith('s1')
    })

    it('onMarkRead が渡されていない場合は呼ばれない', () => {
      const itemsData = [createKanbanItem({ storyId: 's1', bucket: 'unread', order: 0 })]
      vi.mocked(mockStorageService.get).mockReturnValue(
        storedKanban({ items: itemsData, sprintId: '' })
      )
      const { moveItem } = useKanban(mockStorageService)

      expect(() => moveItem('s1', 'read')).not.toThrow()
    })

    it('対象が存在しない場合は何もしない', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { moveItem, items } = useKanban(mockStorageService)

      moveItem('nonexistent', 'read')

      expect(items.value).toEqual([])
      expect(mockStorageService.set).not.toHaveBeenCalled()
    })

    it('同じ列への移動は何もしない（早期 return）', () => {
      const itemsData = [createKanbanItem({ storyId: 's1', bucket: 'unread', order: 0 })]
      vi.mocked(mockStorageService.get).mockReturnValue(
        storedKanban({ items: itemsData, sprintId: '' })
      )
      const setSpy = vi.mocked(mockStorageService.set)
      setSpy.mockClear()
      const { moveItem, items } = useKanban(mockStorageService)

      moveItem('s1', 'unread')

      expect(items.value[0].bucket).toBe('unread')
      expect(setSpy).not.toHaveBeenCalled()
    })
  })

  describe('distributeFromBacklog', () => {
    it('sprintBacklog のストーリーのみ未読列に追加する', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const backlogItems: BacklogItem[] = [
        createBacklogItem({ storyId: 's1', section: 'sprintBacklog' }),
        createBacklogItem({ storyId: 's2', section: 'productBacklog' }),
        createBacklogItem({ storyId: 's3', section: 'sprintBacklog' }),
      ]
      const { distributeFromBacklog, items } = useKanban(mockStorageService)

      distributeFromBacklog(backlogItems)

      expect(items.value).toHaveLength(2)
      expect(items.value.map(i => i.storyId).sort()).toEqual(['s1', 's3'])
      expect(items.value.every(i => i.bucket === 'unread')).toBe(true)
    })

    it('既にカンバンに存在する storyId は追加しない', () => {
      const itemsData = [createKanbanItem({ storyId: 's1', bucket: 'in-progress', order: 0 })]
      vi.mocked(mockStorageService.get).mockReturnValue(
        storedKanban({ items: itemsData, sprintId: 'sprint-1' })
      )
      const backlogItems: BacklogItem[] = [
        createBacklogItem({ storyId: 's1', section: 'sprintBacklog' }),
        createBacklogItem({ storyId: 's2', section: 'sprintBacklog' }),
      ]
      const { distributeFromBacklog, items } = useKanban(mockStorageService)

      distributeFromBacklog(backlogItems)

      expect(items.value).toHaveLength(2)
      const s1 = items.value.find(i => i.storyId === 's1')
      expect(s1?.bucket).toBe('in-progress')
      const s2 = items.value.find(i => i.storyId === 's2')
      expect(s2?.bucket).toBe('unread')
    })

    it('追加するものがない場合は set を呼ばない', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { distributeFromBacklog } = useKanban(mockStorageService)

      distributeFromBacklog([])

      expect(mockStorageService.set).not.toHaveBeenCalled()
    })
  })

  describe('setSprintId', () => {
    it('sprintId を更新し保存する', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { setSprintId, sprintId } = useKanban(mockStorageService)

      setSprintId('new-sprint-id')

      expect(sprintId.value).toBe('new-sprint-id')
      expect(mockStorageService.set).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('"sprintId":"new-sprint-id"')
      )
    })
  })

  describe('setColumnVisibility', () => {
    it('列の表示ON/OFFを部分更新し保存する', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { setColumnVisibility, columnVisibility } = useKanban(mockStorageService)

      setColumnVisibility({ inProgress: false })

      expect(columnVisibility.value.inProgress).toBe(false)
      expect(columnVisibility.value.unread).toBe(true)
      expect(mockStorageService.set).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('"inProgress":false')
      )
    })
  })

  describe('progress', () => {
    it('既読数と総数を返す', () => {
      const itemsData = [
        createKanbanItem({ storyId: 's1', bucket: 'unread', order: 0 }),
        createKanbanItem({ storyId: 's2', bucket: 'in-progress', order: 0 }),
        createKanbanItem({ storyId: 's3', bucket: 'read', order: 0 }),
      ]
      vi.mocked(mockStorageService.get).mockReturnValue(
        storedKanban({ items: itemsData, sprintId: '' })
      )
      const { progress } = useKanban(mockStorageService)

      expect(progress.value).toEqual({ read: 1, total: 3 })
    })

    it('アイテムが空のときは 0/0', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { progress } = useKanban(mockStorageService)

      expect(progress.value).toEqual({ read: 0, total: 0 })
    })
  })

  describe('setOrderInBucket', () => {
    it('指定列内の順序を更新し保存する', () => {
      const itemsData = [
        createKanbanItem({ storyId: 'a', bucket: 'unread', order: 0 }),
        createKanbanItem({ storyId: 'b', bucket: 'unread', order: 1 }),
        createKanbanItem({ storyId: 'c', bucket: 'unread', order: 2 }),
      ]
      vi.mocked(mockStorageService.get).mockReturnValue(
        storedKanban({ items: itemsData, sprintId: '' })
      )
      const { setOrderInBucket, items } = useKanban(mockStorageService)

      setOrderInBucket('unread', ['c', 'a', 'b'])

      expect(items.value.find(i => i.storyId === 'c')?.order).toBe(0)
      expect(items.value.find(i => i.storyId === 'a')?.order).toBe(1)
      expect(items.value.find(i => i.storyId === 'b')?.order).toBe(2)
      expect(mockStorageService.set).toHaveBeenCalled()
    })
  })

  describe('保存に失敗した場合', () => {
    it('moveItem で保存に失敗した場合、エラーを投げる', () => {
      const itemsData = [createKanbanItem({ storyId: 's1', bucket: 'unread', order: 0 })]
      vi.mocked(mockStorageService.get).mockReturnValue(
        storedKanban({ items: itemsData, sprintId: '' })
      )
      const error = new Error('Storage error')
      vi.mocked(mockStorageService.set).mockImplementation(() => {
        throw error
      })
      const { moveItem } = useKanban(mockStorageService)

      expect(() => moveItem('s1', 'read')).toThrow(error)
    })
  })
})
