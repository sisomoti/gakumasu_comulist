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

function getDisplayedIds(getDisplayedItems: () => BacklogItem[]): string[] {
  return getDisplayedItems().map(i => i.storyId)
}

function mountBacklogView(mockBacklogStorage: IStorageService) {
  const sharedStorage = new LocalStorageService()
  sharedStorage.clear()
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
  return wrapper
}

/**
 * 全セクション間移動: 移動元・移動先の状態確認。
 * 新規実装する経路・既存実装の経路を含め、6方向すべてを検証する。
 * 各テストで「移動前に対象IDが移動元セクションにいること」「移動後に移動先に含まれ移動元に含まれないこと」を保存・表示の両方で確認する。
 */
describe('BacklogView 編集モード（統合）: 全セクション間移動（移動元・移動先の状態確認）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1. スプリント→プロダクト: A を移動。移動前はスプリントにあり、移動後はプロダクトにのみある', async () => {
    const initialStored = storedBacklog({ items: [...INITIAL_ITEMS], filter: {} })
    const mockBacklogStorage: IStorageService = {
      get: vi.fn((key: string) => (key === STORAGE_KEY ? initialStored : null)),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }
    const wrapper = mountBacklogView(mockBacklogStorage)
    const vm = wrapper.vm as {
      onProductRankChange: (ordered: string[]) => void
      getBacklogItems: () => BacklogItem[]
      getDisplayedSprintItems: () => BacklogItem[]
      getDisplayedProductItems: () => BacklogItem[]
      getDisplayedOutOfScopeItems: () => BacklogItem[]
    }
    const before = vm.getBacklogItems()
    expect(getSectionIds(before, 'sprintBacklog'), '移動前: A はスプリントにいる').toContain('A')
    expect(getDisplayedIds(vm.getDisplayedSprintItems), '移動前表示: スプリントに A').toContain('A')

    vm.onProductRankChange(['A', 'C', 'D'])
    await wrapper.vm.$nextTick()

    const after = vm.getBacklogItems()
    expect(getSectionIds(after, 'productBacklog'), '移動後保存: プロダクトに A').toContain('A')
    expect(
      getSectionIds(after, 'sprintBacklog'),
      '移動後保存: スプリントに A はいない'
    ).not.toContain('A')
    expect(getDisplayedIds(vm.getDisplayedProductItems), '移動後表示: プロダクトに A').toContain(
      'A'
    )
    expect(
      getDisplayedIds(vm.getDisplayedSprintItems),
      '移動後表示: スプリントに A はいない'
    ).not.toContain('A')
  })

  it('2. プロダクト→スプリント: C を移動。移動前はプロダクトにあり、移動後はスプリントにのみある', async () => {
    const initialStored = storedBacklog({ items: [...INITIAL_ITEMS], filter: {} })
    const mockBacklogStorage: IStorageService = {
      get: vi.fn((key: string) => (key === STORAGE_KEY ? initialStored : null)),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }
    const wrapper = mountBacklogView(mockBacklogStorage)
    const vm = wrapper.vm as {
      onSprintRankChange: (ordered: string[]) => void
      getBacklogItems: () => BacklogItem[]
      getDisplayedSprintItems: () => BacklogItem[]
      getDisplayedProductItems: () => BacklogItem[]
    }
    const before = vm.getBacklogItems()
    expect(getSectionIds(before, 'productBacklog'), '移動前: C はプロダクトにいる').toContain('C')
    expect(getDisplayedIds(vm.getDisplayedProductItems), '移動前表示: プロダクトに C').toContain(
      'C'
    )

    vm.onSprintRankChange(['C', 'A', 'B'])
    await wrapper.vm.$nextTick()

    const after = vm.getBacklogItems()
    expect(getSectionIds(after, 'sprintBacklog'), '移動後保存: スプリントに C').toContain('C')
    expect(
      getSectionIds(after, 'productBacklog'),
      '移動後保存: プロダクトに C はいない'
    ).not.toContain('C')
    expect(getDisplayedIds(vm.getDisplayedSprintItems), '移動後表示: スプリントに C').toContain('C')
    expect(
      getDisplayedIds(vm.getDisplayedProductItems),
      '移動後表示: プロダクトに C はいない'
    ).not.toContain('C')
  })

  it('3. 計画外→プロダクト: E を移動。移動前は計画外にあり、移動後はプロダクトにのみある', async () => {
    const initialStored = storedBacklog({ items: [...INITIAL_ITEMS], filter: {} })
    const mockBacklogStorage: IStorageService = {
      get: vi.fn((key: string) => (key === STORAGE_KEY ? initialStored : null)),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }
    const wrapper = mountBacklogView(mockBacklogStorage)
    const vm = wrapper.vm as {
      onProductRankChange: (ordered: string[]) => void
      getBacklogItems: () => BacklogItem[]
      getDisplayedProductItems: () => BacklogItem[]
      getDisplayedOutOfScopeItems: () => BacklogItem[]
    }
    const before = vm.getBacklogItems()
    expect(getSectionIds(before, 'outOfScope'), '移動前: E は計画外にいる').toContain('E')
    const displayedOutBefore = getDisplayedIds(vm.getDisplayedOutOfScopeItems)
    expect(displayedOutBefore, '移動前表示: 計画外に E').toContain('E')

    vm.onProductRankChange(['E', 'C', 'D'])
    await wrapper.vm.$nextTick()

    const after = vm.getBacklogItems()
    expect(getSectionIds(after, 'productBacklog'), '移動後保存: プロダクトに E').toContain('E')
    expect(getSectionIds(after, 'outOfScope'), '移動後保存: 計画外に E はいない').not.toContain('E')
    expect(getDisplayedIds(vm.getDisplayedProductItems), '移動後表示: プロダクトに E').toContain(
      'E'
    )
    const displayedOutAfter = getDisplayedIds(vm.getDisplayedOutOfScopeItems)
    expect(
      displayedOutAfter,
      '移動後表示: 計画外に E はいない（backlog 上の計画外から減っている）'
    ).not.toContain('E')
  })

  it('4. 計画外→スプリント: E を移動。移動前は計画外にあり、移動後はスプリントにのみある', async () => {
    const initialStored = storedBacklog({ items: [...INITIAL_ITEMS], filter: {} })
    const mockBacklogStorage: IStorageService = {
      get: vi.fn((key: string) => (key === STORAGE_KEY ? initialStored : null)),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }
    const wrapper = mountBacklogView(mockBacklogStorage)
    const vm = wrapper.vm as {
      onSprintRankChange: (ordered: string[]) => void
      getBacklogItems: () => BacklogItem[]
      getDisplayedSprintItems: () => BacklogItem[]
      getDisplayedOutOfScopeItems: () => BacklogItem[]
    }
    const before = vm.getBacklogItems()
    expect(getSectionIds(before, 'outOfScope'), '移動前: E は計画外にいる').toContain('E')
    expect(getDisplayedIds(vm.getDisplayedOutOfScopeItems), '移動前表示: 計画外に E').toContain('E')

    vm.onSprintRankChange(['E', 'A', 'B'])
    await wrapper.vm.$nextTick()

    const after = vm.getBacklogItems()
    expect(getSectionIds(after, 'sprintBacklog'), '移動後保存: スプリントに E').toContain('E')
    expect(getSectionIds(after, 'outOfScope'), '移動後保存: 計画外に E はいない').not.toContain('E')
    expect(getDisplayedIds(vm.getDisplayedSprintItems), '移動後表示: スプリントに E').toContain('E')
    expect(
      getDisplayedIds(vm.getDisplayedOutOfScopeItems),
      '移動後表示: 計画外に E はいない'
    ).not.toContain('E')
  })

  it('5. プロダクト→計画外: C を移動。移動前はプロダクトにあり、移動後は計画外にのみある', async () => {
    const initialStored = storedBacklog({ items: [...INITIAL_ITEMS], filter: {} })
    const mockBacklogStorage: IStorageService = {
      get: vi.fn((key: string) => (key === STORAGE_KEY ? initialStored : null)),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }
    const wrapper = mountBacklogView(mockBacklogStorage)
    const vm = wrapper.vm as {
      moveToOutOfScope: (storyId: string) => void
      getBacklogItems: () => BacklogItem[]
      getDisplayedProductItems: () => BacklogItem[]
      getDisplayedOutOfScopeItems: () => BacklogItem[]
    }
    const before = vm.getBacklogItems()
    expect(getSectionIds(before, 'productBacklog'), '移動前: C はプロダクトにいる').toContain('C')
    expect(getDisplayedIds(vm.getDisplayedProductItems), '移動前表示: プロダクトに C').toContain(
      'C'
    )

    vm.moveToOutOfScope('C')
    await wrapper.vm.$nextTick()

    const after = vm.getBacklogItems()
    expect(getSectionIds(after, 'outOfScope'), '移動後保存: 計画外に C').toContain('C')
    expect(
      getSectionIds(after, 'productBacklog'),
      '移動後保存: プロダクトに C はいない'
    ).not.toContain('C')
    expect(getDisplayedIds(vm.getDisplayedOutOfScopeItems), '移動後表示: 計画外に C').toContain('C')
    expect(
      getDisplayedIds(vm.getDisplayedProductItems),
      '移動後表示: プロダクトに C はいない'
    ).not.toContain('C')
  })

  it('6. スプリント→計画外: A を移動。移動前はスプリントにあり、移動後は計画外にのみある', async () => {
    const initialStored = storedBacklog({ items: [...INITIAL_ITEMS], filter: {} })
    const mockBacklogStorage: IStorageService = {
      get: vi.fn((key: string) => (key === STORAGE_KEY ? initialStored : null)),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }
    const wrapper = mountBacklogView(mockBacklogStorage)
    const vm = wrapper.vm as {
      moveToOutOfScope: (storyId: string) => void
      getBacklogItems: () => BacklogItem[]
      getDisplayedSprintItems: () => BacklogItem[]
      getDisplayedOutOfScopeItems: () => BacklogItem[]
    }
    const before = vm.getBacklogItems()
    expect(getSectionIds(before, 'sprintBacklog'), '移動前: A はスプリントにいる').toContain('A')
    expect(getDisplayedIds(vm.getDisplayedSprintItems), '移動前表示: スプリントに A').toContain('A')

    vm.moveToOutOfScope('A')
    await wrapper.vm.$nextTick()

    const after = vm.getBacklogItems()
    expect(getSectionIds(after, 'outOfScope'), '移動後保存: 計画外に A').toContain('A')
    expect(
      getSectionIds(after, 'sprintBacklog'),
      '移動後保存: スプリントに A はいない'
    ).not.toContain('A')
    expect(getDisplayedIds(vm.getDisplayedOutOfScopeItems), '移動後表示: 計画外に A').toContain('A')
    expect(
      getDisplayedIds(vm.getDisplayedSprintItems),
      '移動後表示: スプリントに A はいない'
    ).not.toContain('A')
  })
})

/**
 * BacklogView をマウントし、編集モードで3セクションを行き来する全順列で
 * 保存後に各セクションの最終編集状態が反映されていることを確認する。
 *
 * ストレージは inject で差し替え、実装と同じ経路（onSprintRankChange / onProductRankChange / moveToOutOfScope）で編集する。
 * 想定仕様: 異なるセクションへの移動時は rank に加えて moveToXXX による section 変更が必須。範囲外への移動は moveToOutOfScope。
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
        getDisplayedSprintItems: () => BacklogItem[]
        getDisplayedProductItems: () => BacklogItem[]
        getDisplayedOutOfScopeItems: () => BacklogItem[]
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

      // 表示状態が保存状態と一致する（保存時に編集前が表示される不具合の検出）
      const displayedSprint = getDisplayedIds(vm.getDisplayedSprintItems)
      const displayedProduct = getDisplayedIds(vm.getDisplayedProductItems)
      const displayedOut = getDisplayedIds(vm.getDisplayedOutOfScopeItems).slice().sort()
      expect(displayedSprint, '表示スプリント = 保存スプリント').toEqual(sprintIds)
      expect(displayedProduct, '表示プロダクト = 保存プロダクト').toEqual(productIds)
      expect(displayedOut, '表示範囲外 = 保存範囲外').toEqual(outIds.slice().sort())

      expect(mockBacklogStorage.set).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('"storyId":"B"')
      )
    })
  })
})

/**
 * 同セクション内は setRanks のみでよい。
 * 異なるセクションへの移動（スプリント↔プロダクト）では、想定仕様どおり moveToXXX により section 変更が必須。
 * 以下は同セクション内の並べ替えと、セクション移動を伴うケース（仕様通りの最終状態を検証；現状の実装は誤りで未対応のため失敗する想定）。
 */
describe('BacklogView 編集モード（統合）: setRanks のみの操作', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('スプリント内のみ並べ替え: 保存・表示とも [B,A] でリストが消えない', async () => {
    const initialStored = storedBacklog({ items: [...INITIAL_ITEMS], filter: {} })
    const mockBacklogStorage: IStorageService = {
      get: vi.fn((key: string) => (key === STORAGE_KEY ? initialStored : null)),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }
    const wrapper = mountBacklogView(mockBacklogStorage)
    const vm = wrapper.vm as {
      onSprintRankChange: (ordered: string[]) => void
      getBacklogItems: () => BacklogItem[]
      getDisplayedSprintItems: () => BacklogItem[]
    }
    vm.onSprintRankChange(['B', 'A'])
    await wrapper.vm.$nextTick()

    const items = vm.getBacklogItems()
    const sprintIds = getSectionIds(items, 'sprintBacklog')
    expect(sprintIds, '保存: スプリント [B,A]').toEqual(['B', 'A'])
    const displayed = getDisplayedIds(vm.getDisplayedSprintItems)
    expect(displayed, '表示: スプリント [B,A]').toEqual(['B', 'A'])
    expect(displayed.length, 'リストが消えていない').toBe(2)
  })

  it('プロダクト内のみ並べ替え: 保存・表示とも [D,C] でリストが消えない', async () => {
    const initialStored = storedBacklog({ items: [...INITIAL_ITEMS], filter: {} })
    const mockBacklogStorage: IStorageService = {
      get: vi.fn((key: string) => (key === STORAGE_KEY ? initialStored : null)),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }
    const wrapper = mountBacklogView(mockBacklogStorage)
    const vm = wrapper.vm as {
      onProductRankChange: (ordered: string[]) => void
      getBacklogItems: () => BacklogItem[]
      getDisplayedProductItems: () => BacklogItem[]
    }
    vm.onProductRankChange(['D', 'C'])
    await wrapper.vm.$nextTick()

    const items = vm.getBacklogItems()
    const productIds = getSectionIds(items, 'productBacklog')
    expect(productIds, '保存: プロダクト [D,C]').toEqual(['D', 'C'])
    const displayed = getDisplayedIds(vm.getDisplayedProductItems)
    expect(displayed, '表示: プロダクト [D,C]').toEqual(['D', 'C'])
    expect(displayed.length, 'リストが消えていない').toBe(2)
  })

  /** 仕様: プロダクトに A をドロップしたとき moveToProductBacklog('A') で section を productBacklog に変更すること。保存・表示はスプリント [B] プロダクト [A,C,D]。 */
  it('スプリント→プロダクトへ1件移動: 保存・表示ともスプリント [B] プロダクト [A,C,D]', async () => {
    const initialStored = storedBacklog({ items: [...INITIAL_ITEMS], filter: {} })
    const mockBacklogStorage: IStorageService = {
      get: vi.fn((key: string) => (key === STORAGE_KEY ? initialStored : null)),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }
    const wrapper = mountBacklogView(mockBacklogStorage)
    const vm = wrapper.vm as {
      onProductRankChange: (ordered: string[]) => void
      getBacklogItems: () => BacklogItem[]
      getDisplayedSprintItems: () => BacklogItem[]
      getDisplayedProductItems: () => BacklogItem[]
    }
    vm.onProductRankChange(['A', 'C', 'D'])
    await wrapper.vm.$nextTick()

    const items = vm.getBacklogItems()
    expect(getSectionIds(items, 'sprintBacklog'), '保存: スプリント [B]').toEqual(['B'])
    expect(getSectionIds(items, 'productBacklog'), '保存: プロダクト [A,C,D]').toEqual([
      'A',
      'C',
      'D',
    ])
    expect(getDisplayedIds(vm.getDisplayedSprintItems), '表示: スプリント').toEqual(['B'])
    expect(getDisplayedIds(vm.getDisplayedProductItems), '表示: プロダクト').toEqual([
      'A',
      'C',
      'D',
    ])
  })

  /** 仕様: スプリントに C をドロップしたとき moveToSprintBacklog('C') で section を sprintBacklog に変更すること。保存・表示はスプリント [C,A,B] プロダクト [D]。 */
  it('プロダクト→スプリントへ1件移動: 保存・表示ともスプリント [C,A,B] プロダクト [D]', async () => {
    const initialStored = storedBacklog({ items: [...INITIAL_ITEMS], filter: {} })
    const mockBacklogStorage: IStorageService = {
      get: vi.fn((key: string) => (key === STORAGE_KEY ? initialStored : null)),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }
    const wrapper = mountBacklogView(mockBacklogStorage)
    const vm = wrapper.vm as {
      onSprintRankChange: (ordered: string[]) => void
      getBacklogItems: () => BacklogItem[]
      getDisplayedSprintItems: () => BacklogItem[]
      getDisplayedProductItems: () => BacklogItem[]
    }
    vm.onSprintRankChange(['C', 'A', 'B'])
    await wrapper.vm.$nextTick()

    const items = vm.getBacklogItems()
    expect(getSectionIds(items, 'sprintBacklog'), '保存: スプリント [C,A,B]').toEqual([
      'C',
      'A',
      'B',
    ])
    expect(getSectionIds(items, 'productBacklog'), '保存: プロダクト [D]').toEqual(['D'])
    expect(getDisplayedIds(vm.getDisplayedSprintItems), '表示: スプリント').toEqual(['C', 'A', 'B'])
    expect(getDisplayedIds(vm.getDisplayedProductItems), '表示: プロダクト').toEqual(['D'])
  })

  it('編集後「完了」クリック後も表示は編集後の状態', async () => {
    const initialStored = storedBacklog({ items: [...INITIAL_ITEMS], filter: {} })
    const mockBacklogStorage: IStorageService = {
      get: vi.fn((key: string) => (key === STORAGE_KEY ? initialStored : null)),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }
    const wrapper = mountBacklogView(mockBacklogStorage)
    const vm = wrapper.vm as {
      onSprintRankChange: (ordered: string[]) => void
      getDisplayedSprintItems: () => BacklogItem[]
    }
    await wrapper.find('.btn-edit').trigger('click')
    await wrapper.vm.$nextTick()
    vm.onSprintRankChange(['B', 'A'])
    await wrapper.vm.$nextTick()
    await wrapper.find('.btn-done').trigger('click')
    await wrapper.vm.$nextTick()

    const displayed = getDisplayedIds(vm.getDisplayedSprintItems)
    expect(displayed, '完了後も表示は [B,A]').toEqual(['B', 'A'])
  })
})
