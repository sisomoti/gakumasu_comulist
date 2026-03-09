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
 * 編集モードで3セクションを行き来する全順列で、
 * 保存後に各セクションで「最後に編集した状態」が反映されていることを確認する。
 *
 * 行う編集:
 * - スプリント: 順序を [B, A] に変更
 * - プロダクト: 順序を [D, C] に変更
 * - 範囲外: A を範囲外に移動
 *
 * 期待する最終状態（どの順序で編集しても同じ）:
 * - スプリント: [B]
 * - プロダクト: [D, C]
 * - 範囲外: E と A が含まれる（順序は rank に依存するため不定）
 */
describe('BacklogView 編集モード: 3セクション相互編集の全順列', () => {
  const permutations: Array<{ order: [number, number, number]; label: string }> = [
    { order: [0, 1, 2], label: 'スプリント → プロダクト → 範囲外' },
    { order: [0, 2, 1], label: 'スプリント → 範囲外 → プロダクト' },
    { order: [1, 0, 2], label: 'プロダクト → スプリント → 範囲外' },
    { order: [1, 2, 0], label: 'プロダクト → 範囲外 → スプリント' },
    { order: [2, 0, 1], label: '範囲外 → スプリント → プロダクト' },
    { order: [2, 1, 0], label: '範囲外 → プロダクト → スプリント' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  permutations.forEach(({ order, label }) => {
    it(`${label} で編集し保存すると、各セクションの最終編集状態が反映される`, () => {
      const initialStored = storedBacklog({ items: [...INITIAL_ITEMS], filter: {} })
      const mockStorage: IStorageService = {
        get: vi.fn((key: string) => (key === STORAGE_KEY ? initialStored : null)),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      }

      const { items, setRanks, moveToOutOfScope } = useBacklog(mockStorage)

      // 編集を順列の順で適用（BacklogView の onSprintRankChange / onProductRankChange / moveToOutOfScope と同様）
      function applyEditSprint() {
        const sprintIds = getSectionIds(items.value, 'sprintBacklog')
        const productIds = getSectionIds(items.value, 'productBacklog')
        const outIds = getSectionIds(items.value, 'outOfScope')
        // スプリント内の順序を [B, A] に
        const newSprintOrder = ['B', 'A'].filter(id => sprintIds.includes(id))
        const restSprint = sprintIds.filter(id => !newSprintOrder.includes(id))
        setRanks([...newSprintOrder, ...restSprint, ...productIds, ...outIds])
      }

      function applyEditProduct() {
        const sprintIds = getSectionIds(items.value, 'sprintBacklog')
        const productIds = getSectionIds(items.value, 'productBacklog')
        const outIds = getSectionIds(items.value, 'outOfScope')
        // プロダクト内の順序を [D, C] に
        const newProductOrder = ['D', 'C'].filter(id => productIds.includes(id))
        const restProduct = productIds.filter(id => !newProductOrder.includes(id))
        setRanks([...sprintIds, ...newProductOrder, ...restProduct, ...outIds])
      }

      function applyEditOutOfScope() {
        moveToOutOfScope('A')
      }

      const edits = [() => applyEditSprint(), () => applyEditProduct(), () => applyEditOutOfScope()]

      for (const idx of order) {
        edits[idx]()
      }

      // 保存後（setRanks / moveToOutOfScope はその都度保存している）の状態を確認
      const sprintIds = getSectionIds(items.value, 'sprintBacklog')
      const productIds = getSectionIds(items.value, 'productBacklog')
      const outIds = getSectionIds(items.value, 'outOfScope')

      expect(sprintIds, 'スプリントは最後の編集状態 [B]').toEqual(['B'])
      expect(productIds, 'プロダクトは最後の編集状態 [D, C]').toEqual(['D', 'C'])
      expect(outIds.slice().sort(), '範囲外は E と A が含まれる').toEqual(['A', 'E'])

      // ストレージにも保存されていることを確認
      expect(mockStorage.set).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('"storyId":"B"')
      )
    })
  })
})
