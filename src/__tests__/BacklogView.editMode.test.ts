import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useBacklog } from '../composables/useBacklog'
import type { IStorageService } from '../services/interfaces/IStorageService'
import { READING_PLAN_STORAGE_KEYS } from '../types/storage'
import type { BacklogItem, BacklogFilter } from '../types/domain/backlog'

const STORAGE_KEY = READING_PLAN_STORAGE_KEYS.backlog

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

/** 初期バックログ: A,B=スプリント, C,D=プロダクト, E=範囲外 */
const INITIAL_ITEMS: BacklogItem[] = [
  { storyId: 'A', rank: 0, section: 'sprintBacklog' },
  { storyId: 'B', rank: 1, section: 'sprintBacklog' },
  { storyId: 'C', rank: 2, section: 'productBacklog' },
  { storyId: 'D', rank: 3, section: 'productBacklog' },
  { storyId: 'E', rank: 4, section: 'outOfScope' },
]

function getSectionIds(items: BacklogItem[], section: BacklogItem['section']): string[] {
  return items
    .filter(i => i.section === section)
    .sort((a, b) => a.rank - b.rank)
    .map(i => i.storyId)
}

/**
 * 3セクションから移動元・移動先を順序付きで選ぶ 3P2 の全6通り。
 * 各方向で1要素を他セクションへ移動したとき、useBacklog 単体で保存・反映されることを確認する。
 */
describe('BacklogView 編集モード: 3セクション間移動（3P2）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createMockStorage(initialStored: string): IStorageService {
    return {
      get: vi.fn((key: string) => (key === STORAGE_KEY ? initialStored : null)),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }
  }

  it('1. スプリント→プロダクト: A を移動。移動後はプロダクトにのみある', () => {
    const mockStorage = createMockStorage(storedBacklog({ items: [...INITIAL_ITEMS], filter: {} }))
    const { items, setRanks, moveToProductBacklog } = useBacklog(mockStorage)
    moveToProductBacklog('A')
    setRanks(['B', 'A', 'C', 'D', 'E'])
    expect(getSectionIds(items.value, 'sprintBacklog')).toEqual(['B'])
    expect(getSectionIds(items.value, 'productBacklog')).toEqual(['A', 'C', 'D'])
  })

  it('2. プロダクト→スプリント: C を移動。移動後はスプリントにのみある', () => {
    const mockStorage = createMockStorage(storedBacklog({ items: [...INITIAL_ITEMS], filter: {} }))
    const { items, setRanks, moveToSprintBacklog } = useBacklog(mockStorage)
    moveToSprintBacklog('C')
    setRanks(['C', 'A', 'B', 'D', 'E'])
    expect(getSectionIds(items.value, 'sprintBacklog')).toEqual(['C', 'A', 'B'])
    expect(getSectionIds(items.value, 'productBacklog')).toEqual(['D'])
  })

  it('3. スプリント→範囲外: A を移動。移動後は範囲外にのみある', () => {
    const mockStorage = createMockStorage(storedBacklog({ items: [...INITIAL_ITEMS], filter: {} }))
    const { items, moveToOutOfScope } = useBacklog(mockStorage)
    moveToOutOfScope('A')
    expect(getSectionIds(items.value, 'sprintBacklog')).toEqual(['B'])
    expect(getSectionIds(items.value, 'outOfScope')).toContain('A')
    expect(getSectionIds(items.value, 'outOfScope').sort()).toEqual(['A', 'E'])
  })

  it('4. プロダクト→範囲外: C を移動。移動後は範囲外にのみある', () => {
    const mockStorage = createMockStorage(storedBacklog({ items: [...INITIAL_ITEMS], filter: {} }))
    const { items, moveToOutOfScope } = useBacklog(mockStorage)
    moveToOutOfScope('C')
    expect(getSectionIds(items.value, 'productBacklog')).toEqual(['D'])
    expect(getSectionIds(items.value, 'outOfScope')).toContain('C')
    expect(getSectionIds(items.value, 'outOfScope').sort()).toEqual(['C', 'E'])
  })

  it('5. 範囲外→スプリント: E を移動。移動後はスプリントにのみある', () => {
    const mockStorage = createMockStorage(storedBacklog({ items: [...INITIAL_ITEMS], filter: {} }))
    const { items, setRanks, moveToSprintBacklog } = useBacklog(mockStorage)
    moveToSprintBacklog('E')
    setRanks(['A', 'B', 'C', 'D', 'E'])
    expect(getSectionIds(items.value, 'sprintBacklog')).toContain('E')
    expect(getSectionIds(items.value, 'outOfScope')).not.toContain('E')
  })

  it('6. 範囲外→プロダクト: E を移動。移動後はプロダクトにのみある', () => {
    const mockStorage = createMockStorage(storedBacklog({ items: [...INITIAL_ITEMS], filter: {} }))
    const { items, setRanks, moveToProductBacklog } = useBacklog(mockStorage)
    moveToProductBacklog('E')
    setRanks(['A', 'B', 'C', 'D', 'E'])
    expect(getSectionIds(items.value, 'productBacklog')).toContain('E')
    expect(getSectionIds(items.value, 'outOfScope')).not.toContain('E')
  })
})

/**
 * 同セクション内の入れ替えは setRanks のみでよい。
 * useBacklog 単体で正しく保存されることを確認。統合テストで setRanks 経路が失敗する場合、ここが通れば原因はコンポーネント層にある。
 */
describe('BacklogView 編集モード: setRanks のみの操作（useBacklog 単体）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('スプリント内のみ並べ替え: 保存後スプリント [B,A]', () => {
    const initialStored = storedBacklog({ items: [...INITIAL_ITEMS], filter: {} })
    const mockStorage: IStorageService = {
      get: vi.fn((key: string) => (key === STORAGE_KEY ? initialStored : null)),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }
    const { items, setRanks } = useBacklog(mockStorage)
    setRanks(['B', 'A', 'C', 'D', 'E'])
    const sprintIds = getSectionIds(items.value, 'sprintBacklog')
    expect(sprintIds).toEqual(['B', 'A'])
    expect(getSectionIds(items.value, 'productBacklog')).toEqual(['C', 'D'])
  })

  it('プロダクト内のみ並べ替え: 保存後プロダクト [D,C]', () => {
    const initialStored = storedBacklog({ items: [...INITIAL_ITEMS], filter: {} })
    const mockStorage: IStorageService = {
      get: vi.fn((key: string) => (key === STORAGE_KEY ? initialStored : null)),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }
    const { items, setRanks } = useBacklog(mockStorage)
    setRanks(['A', 'B', 'D', 'C', 'E'])
    const productIds = getSectionIds(items.value, 'productBacklog')
    expect(productIds).toEqual(['D', 'C'])
    expect(getSectionIds(items.value, 'sprintBacklog')).toEqual(['A', 'B'])
  })
})
