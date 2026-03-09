import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import BacklogView from '../components/BacklogView.vue'
import type { IStorageService } from '../services/interfaces/IStorageService'
import type { IStoryRepository } from '../services/interfaces/IStoryRepository'
import type { ExternalGameData } from '../types/domain'
import type { ProduceCardStory } from '../types/domain'
import type { BacklogItem, BacklogFilter } from '../types/domain/backlog'
import { READING_PLAN_STORAGE_KEYS } from '../types/storage'
import { useReadStatus } from '../composables/useReadStatus'
import { useCardOwnership } from '../composables/useCardOwnership'
import { LocalStorageService } from '../services/storage/LocalStorageService'

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

const STORY_IDS = ['A', 'B', 'C', 'D', 'E'] as const

function createMockStories(): ProduceCardStory[] {
  return STORY_IDS.map((id, i) => ({
    id,
    produceCardId: `card-${id}`,
    storyIndex: 1,
  }))
}

function createMockRepository(stories: ProduceCardStory[]): IStoryRepository {
  return {
    getAllProduceCardStories: () => stories,
    getAllSupportCardStories: () => [],
    getAllStories: () => stories,
    findById: (id: string) => stories.find(s => s.id === id),
    findByProduceCardId: (produceCardId: string) =>
      stories.filter(s => s.produceCardId === produceCardId),
    findBySupportCardId: () => [],
  }
}

function createMinimalGameData(storyIds: readonly string[]): ExternalGameData {
  return {
    version: '1.0.0-test',
    lastUpdated: new Date().toISOString(),
    idols: [{ id: 'idol-1', name: 'Test' }],
    produceCards: storyIds.map(id => ({
      id: `card-${id}`,
      name: id,
      idolId: 'idol-1',
      rarity: 'R' as const,
    })),
    supportCards: [],
    produceCardStories: storyIds.map(id => ({
      id,
      produceCardId: `card-${id}`,
      storyIndex: 1,
    })),
    supportCardStories: [],
  }
}

function getSectionIds(items: BacklogItem[], section: BacklogItem['section']): string[] {
  return items
    .filter(i => i.section === section)
    .sort((a, b) => a.rank - b.rank)
    .map(i => i.storyId)
}

/**
 * BacklogView をマウントし、編集モードで3セクションを行き来する全順列で
 * 保存後に各セクションの最終編集状態が反映されていることを確認する。
 *
 * ストレージは inject で差し替え、実装と同じ経路（onSprintRankChange / onProductRankChange / moveToOutOfScope）で編集する。
 */
describe('BacklogView 編集モード（統合）: 3セクション相互編集の全順列', () => {
  const permutations: Array<{ order: [number, number, number]; label: string }> = [
    { order: [0, 1, 2], label: 'スプリント → プロダクト → 範囲外' },
    { order: [0, 2, 1], label: 'スプリント → 範囲外 → プロダクト' },
    { order: [1, 0, 2], label: 'プロダクト → スプリント → 範囲外' },
    { order: [1, 2, 0], label: 'プロダクト → 範囲外 → スプリント' },
    { order: [2, 0, 1], label: '範囲外 → スプリント → プロダクト' },
    { order: [2, 1, 0], label: '範囲外 → プロダクト → スプリント' },
  ]

  let mockBacklogStorage: IStorageService
  let sharedStorage: LocalStorageService

  beforeEach(() => {
    vi.clearAllMocks()
    sharedStorage = new LocalStorageService()
    sharedStorage.clear()
  })

  permutations.forEach(({ order, label }) => {
    it(`${label} で編集し保存すると、各セクションの最終編集状態が反映される`, async () => {
      const initialStored = storedBacklog({ items: [...INITIAL_ITEMS], filter: {} })
      mockBacklogStorage = {
        get: vi.fn((key: string) => (key === STORAGE_KEY ? initialStored : null)),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      }

      const stories = createMockStories()
      const repository = createMockRepository(stories)
      const gameData = createMinimalGameData(STORY_IDS)

      const readStatus = useReadStatus(sharedStorage)
      const cardOwnership = useCardOwnership(sharedStorage)

      const repositoryRef = ref<IStoryRepository>(repository)
      const gameDataRef = ref<ExternalGameData>(gameData)
      const readStatusRef = ref(readStatus)
      const cardOwnershipRef = ref(cardOwnership)

      const wrapper = mount(BacklogView, {
        global: {
          provide: {
            repository: repositoryRef,
            gameData: gameDataRef,
            readStatus: readStatusRef,
            cardOwnership: cardOwnershipRef,
            backlogStorage: mockBacklogStorage,
          },
        },
      })

      const vm = wrapper.vm as {
        onSprintRankChange: (ordered: string[]) => void
        onProductRankChange: (ordered: string[]) => void
        moveToOutOfScope: (storyId: string) => void
        getBacklogItems: () => BacklogItem[]
      }

      const edits = [
        () => vm.onSprintRankChange(['B', 'A']),
        () => vm.onProductRankChange(['D', 'C']),
        () => vm.moveToOutOfScope('A'),
      ]

      for (const idx of order) {
        edits[idx]()
        await wrapper.vm.$nextTick()
      }

      const items = vm.getBacklogItems()
      const sprintIds = getSectionIds(items, 'sprintBacklog')
      const productIds = getSectionIds(items, 'productBacklog')
      const outIds = getSectionIds(items, 'outOfScope')

      expect(sprintIds, 'スプリントは最後の編集状態 [B]').toEqual(['B'])
      expect(productIds, 'プロダクトは最後の編集状態 [D, C]').toEqual(['D', 'C'])
      expect(outIds.slice().sort(), '範囲外は E と A が含まれる').toEqual(['A', 'E'])

      expect(mockBacklogStorage.set).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('"storyId":"B"')
      )
    })
  })
})
