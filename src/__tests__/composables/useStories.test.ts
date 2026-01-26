import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStories } from '../../composables/useStories'
import { StoryRepository } from '../../services/repository/StoryRepository'
import { useReadStatus } from '../../composables/useReadStatus'
import { useCardOwnership } from '../../composables/useCardOwnership'
import type { ExternalGameData, ProduceCardStory, SupportCardStory } from '../../types/domain'
import type { IStoryRepository } from '../../services/interfaces/IStoryRepository'

describe('useStories', () => {
  let mockRepository: IStoryRepository
  let mockGameData: ExternalGameData
  let mockReadStatus: ReturnType<typeof useReadStatus>
  let mockCardOwnership: ReturnType<typeof useCardOwnership>

  beforeEach(() => {
    mockGameData = {
      version: '1.0.0',
      lastUpdated: '2024-01-01T00:00:00Z',
      idols: [
        { id: 'idol-1', name: 'アイドル1' },
        { id: 'idol-2', name: 'アイドル2' },
      ],
      produceCards: [
        { id: 'produce-1', name: 'プロデュースカード1', idolId: 'idol-1', rarity: 'SSR' },
        { id: 'produce-2', name: 'プロデュースカード2', idolId: 'idol-2', rarity: 'SR' },
      ],
      supportCards: [
        {
          id: 'support-1',
          name: 'サポートカード1',
          mainIdolId: 'idol-1',
          appearingIdolIds: [],
          rarity: 'SSR',
        },
        {
          id: 'support-2',
          name: 'サポートカード2',
          mainIdolId: 'idol-2',
          appearingIdolIds: [],
          rarity: 'SR',
        },
      ],
      produceCardStories: [
        { id: 'produce-1-story-1', produceCardId: 'produce-1', storyIndex: 1 },
        { id: 'produce-1-story-2', produceCardId: 'produce-1', storyIndex: 2 },
        { id: 'produce-1-story-3', produceCardId: 'produce-1', storyIndex: 3 },
      ],
      supportCardStories: [
        { id: 'support-1-story-1', supportCardId: 'support-1', storyIndex: 1 },
        { id: 'support-1-story-2', supportCardId: 'support-1', storyIndex: 2 },
        { id: 'support-1-story-3', supportCardId: 'support-1', storyIndex: 3 },
        { id: 'support-2-story-1', supportCardId: 'support-2', storyIndex: 1 },
        { id: 'support-2-story-2', supportCardId: 'support-2', storyIndex: 2 },
      ],
    }

    mockRepository = new StoryRepository(mockGameData)

    // useReadStatusのモック
    mockReadStatus = {
      isRead: vi.fn((storyId: string) => false),
      toggleRead: vi.fn(),
      setRead: vi.fn(),
      getAllReadStories: vi.fn(() => []),
      loadReadStatus: vi.fn(),
    }

    // useCardOwnershipのモック
    mockCardOwnership = {
      isOwned: vi.fn((cardId: string) => true),
      toggleOwned: vi.fn(),
      setOwned: vi.fn(),
      getAllOwnedCards: vi.fn(() => []),
      loadOwnership: vi.fn(),
    }
  })

  describe('基本機能', () => {
    it('StoryRepositoryからすべてのストーリーを取得できる', () => {
      const { allStories } = useStories(
        mockRepository,
        mockGameData,
        mockReadStatus,
        mockCardOwnership
      )

      expect(allStories.value).toHaveLength(8) // 3 + 5
      expect(allStories.value.some(s => s.id === 'produce-1-story-1')).toBe(true)
      expect(allStories.value.some(s => s.id === 'support-1-story-1')).toBe(true)
    })

    it('ストーリーが存在しない場合は空配列を返す', () => {
      const emptyGameData: ExternalGameData = {
        ...mockGameData,
        produceCardStories: [],
        supportCardStories: [],
      }
      const emptyRepository = new StoryRepository(emptyGameData)
      const { allStories } = useStories(
        emptyRepository,
        emptyGameData,
        mockReadStatus,
        mockCardOwnership
      )

      expect(allStories.value).toEqual([])
    })

    it('プロデュースカードストーリーのみを取得できる', () => {
      const { produceCardStories } = useStories(
        mockRepository,
        mockGameData,
        mockReadStatus,
        mockCardOwnership
      )

      expect(produceCardStories.value).toHaveLength(3)
      expect(produceCardStories.value.every(s => 'produceCardId' in s)).toBe(true)
    })

    it('サポートカードストーリーのみを取得できる', () => {
      const { supportCardStories } = useStories(
        mockRepository,
        mockGameData,
        mockReadStatus,
        mockCardOwnership
      )

      expect(supportCardStories.value).toHaveLength(5)
      expect(supportCardStories.value.every(s => 'supportCardId' in s)).toBe(true)
    })
  })

  describe('フィルタリング機能 - 単一フィルタ', () => {
    describe('cardTypeフィルタ', () => {
      it('produceを指定するとプロデュースカードストーリーのみを返す', () => {
        const { filteredStories, setFilter } = useStories(
          mockRepository,
          mockGameData,
          mockReadStatus,
          mockCardOwnership
        )

        setFilter({ cardType: 'produce' })

        expect(filteredStories.value).toHaveLength(3)
        expect(filteredStories.value.every(s => 'produceCardId' in s)).toBe(true)
      })

      it('supportを指定するとサポートカードストーリーのみを返す', () => {
        const { filteredStories, setFilter } = useStories(
          mockRepository,
          mockGameData,
          mockReadStatus,
          mockCardOwnership
        )

        setFilter({ cardType: 'support' })

        expect(filteredStories.value).toHaveLength(5)
        expect(filteredStories.value.every(s => 'supportCardId' in s)).toBe(true)
      })
    })

    describe('rarityフィルタ', () => {
      it('単一のレアリティでフィルタできる', () => {
        const { filteredStories, setFilter } = useStories(
          mockRepository,
          mockGameData,
          mockReadStatus,
          mockCardOwnership
        )

        setFilter({ rarity: 'SSR' })

        // SSRカードは produce-1 と support-1 の2つ
        // それぞれに3つのストーリーがあるので、合計6つ
        expect(filteredStories.value.length).toBeGreaterThan(0)
        filteredStories.value.forEach(story => {
          const card =
            'produceCardId' in story
              ? mockGameData.produceCards.find(
                  c => c.id === (story as ProduceCardStory).produceCardId
                )
              : mockGameData.supportCards.find(
                  c => c.id === (story as SupportCardStory).supportCardId
                )
          expect(card?.rarity).toBe('SSR')
        })
      })

      it('複数のレアリティでフィルタできる', () => {
        const { filteredStories, setFilter } = useStories(
          mockRepository,
          mockGameData,
          mockReadStatus,
          mockCardOwnership
        )

        setFilter({ rarity: ['SSR', 'SR'] })

        filteredStories.value.forEach(story => {
          const card =
            'produceCardId' in story
              ? mockGameData.produceCards.find(
                  c => c.id === (story as ProduceCardStory).produceCardId
                )
              : mockGameData.supportCards.find(
                  c => c.id === (story as SupportCardStory).supportCardId
                )
          expect(card?.rarity).toMatch(/SSR|SR/)
        })
      })
    })

    describe('unreadOnlyフィルタ', () => {
      it('unreadOnlyがtrueの場合、未読のストーリーのみを返す', () => {
        // 一部のストーリーを読了済みにする
        vi.mocked(mockReadStatus.isRead).mockImplementation((storyId: string) => {
          return storyId === 'produce-1-story-1' || storyId === 'support-1-story-1'
        })

        const { filteredStories, setFilter } = useStories(
          mockRepository,
          mockGameData,
          mockReadStatus,
          mockCardOwnership
        )

        setFilter({ unreadOnly: true })

        expect(filteredStories.value.length).toBe(6) // 8 - 2 = 6
        expect(filteredStories.value.some(s => s.id === 'produce-1-story-1')).toBe(false)
        expect(filteredStories.value.some(s => s.id === 'support-1-story-1')).toBe(false)
      })

      it('unreadOnlyがfalseまたは未指定の場合、すべてのストーリーを返す', () => {
        vi.mocked(mockReadStatus.isRead).mockImplementation((storyId: string) => {
          return storyId === 'produce-1-story-1'
        })

        const { filteredStories, setFilter } = useStories(
          mockRepository,
          mockGameData,
          mockReadStatus,
          mockCardOwnership
        )

        setFilter({ unreadOnly: false })

        expect(filteredStories.value).toHaveLength(8)
      })
    })

    describe('ownedOnlyフィルタ', () => {
      it('ownedOnlyがtrueの場合、所持カードのストーリーのみを返す', () => {
        // 一部のカードのみ所持している状態にする
        vi.mocked(mockCardOwnership.isOwned).mockImplementation((cardId: string) => {
          return cardId === 'produce-1' || cardId === 'support-1'
        })

        const { filteredStories, setFilter } = useStories(
          mockRepository,
          mockGameData,
          mockReadStatus,
          mockCardOwnership
        )

        setFilter({ ownedOnly: true })

        // produce-1 と support-1 のストーリーのみ（3 + 3 = 6）
        expect(filteredStories.value).toHaveLength(6)
        filteredStories.value.forEach(story => {
          const cardId =
            'produceCardId' in story
              ? (story as ProduceCardStory).produceCardId
              : (story as SupportCardStory).supportCardId
          expect(['produce-1', 'support-1']).toContain(cardId)
        })
      })

      it('ownedOnlyがfalseまたは未指定の場合、すべてのストーリーを返す', () => {
        vi.mocked(mockCardOwnership.isOwned).mockImplementation(() => false)

        const { filteredStories, setFilter } = useStories(
          mockRepository,
          mockGameData,
          mockReadStatus,
          mockCardOwnership
        )

        setFilter({ ownedOnly: false })

        expect(filteredStories.value).toHaveLength(8)
      })
    })

    describe('idolIdsフィルタ', () => {
      it('特定のアイドルのストーリーのみを返す（プロデュースカード）', () => {
        const { filteredStories, setFilter } = useStories(
          mockRepository,
          mockGameData,
          mockReadStatus,
          mockCardOwnership
        )

        setFilter({ idolIds: ['idol-1'] })

        // idol-1 のプロデュースカード（produce-1）のストーリーのみ（3つ）
        expect(filteredStories.value.length).toBeGreaterThan(0)
        filteredStories.value.forEach(story => {
          if ('produceCardId' in story) {
            const card = mockGameData.produceCards.find(
              c => c.id === (story as ProduceCardStory).produceCardId
            )
            expect(card?.idolId).toBe('idol-1')
          } else {
            // サポートカードの場合、mainIdolIdまたはappearingIdolIdsに含まれる
            const card = mockGameData.supportCards.find(
              c => c.id === (story as SupportCardStory).supportCardId
            )
            expect(card?.mainIdolId === 'idol-1' || card?.appearingIdolIds.includes('idol-1')).toBe(
              true
            )
          }
        })
      })

      it('複数のアイドルIDでフィルタできる', () => {
        const { filteredStories, setFilter } = useStories(
          mockRepository,
          mockGameData,
          mockReadStatus,
          mockCardOwnership
        )

        setFilter({ idolIds: ['idol-1', 'idol-2'] })

        expect(filteredStories.value.length).toBeGreaterThan(0)
      })
    })
  })

  describe('フィルタリング機能 - 重ねがけ', () => {
    it('cardTypeとrarityを同時に適用できる', () => {
      const { filteredStories, setFilter } = useStories(
        mockRepository,
        mockGameData,
        mockReadStatus,
        mockCardOwnership
      )

      setFilter({ cardType: 'produce', rarity: 'SSR' })

      expect(filteredStories.value.length).toBeGreaterThan(0)
      filteredStories.value.forEach(story => {
        expect('produceCardId' in story).toBe(true)
        const card = mockGameData.produceCards.find(
          c => c.id === (story as ProduceCardStory).produceCardId
        )
        expect(card?.rarity).toBe('SSR')
      })
    })

    it('ownedOnlyとunreadOnlyを同時に適用できる（重要ケース）', () => {
      // 一部のカードのみ所持
      vi.mocked(mockCardOwnership.isOwned).mockImplementation((cardId: string) => {
        return cardId === 'produce-1' || cardId === 'support-1'
      })

      // 一部のストーリーのみ読了
      vi.mocked(mockReadStatus.isRead).mockImplementation((storyId: string) => {
        return storyId === 'produce-1-story-1' || storyId === 'support-1-story-1'
      })

      const { filteredStories, setFilter } = useStories(
        mockRepository,
        mockGameData,
        mockReadStatus,
        mockCardOwnership
      )

      setFilter({ ownedOnly: true, unreadOnly: true })

      // 所持カードかつ未読のストーリーのみ
      // produce-1: 3ストーリー中2つが未読
      // support-1: 3ストーリー中2つが未読
      // 合計4つ
      expect(filteredStories.value.length).toBe(4)
      filteredStories.value.forEach(story => {
        const cardId =
          'produceCardId' in story
            ? (story as ProduceCardStory).produceCardId
            : (story as SupportCardStory).supportCardId
        expect(['produce-1', 'support-1']).toContain(cardId)
        expect(mockReadStatus.isRead(story.id)).toBe(false)
      })
    })

    it('複数のフィルタ条件を同時に適用できる', () => {
      vi.mocked(mockCardOwnership.isOwned).mockImplementation((cardId: string) => {
        return cardId === 'produce-1'
      })

      const { filteredStories, setFilter } = useStories(
        mockRepository,
        mockGameData,
        mockReadStatus,
        mockCardOwnership
      )

      setFilter({
        cardType: 'produce',
        rarity: 'SSR',
        ownedOnly: true,
        idolIds: ['idol-1'],
      })

      expect(filteredStories.value.length).toBeGreaterThan(0)
      filteredStories.value.forEach(story => {
        expect('produceCardId' in story).toBe(true)
        const card = mockGameData.produceCards.find(
          c => c.id === (story as ProduceCardStory).produceCardId
        )
        expect(card?.id).toBe('produce-1')
        expect(card?.rarity).toBe('SSR')
        expect(card?.idolId).toBe('idol-1')
      })
    })
  })

  describe('フィルタ管理機能', () => {
    it('setFilterでフィルタ条件を更新できる（重ねがけ対応）', () => {
      const { filteredStories, setFilter } = useStories(
        mockRepository,
        mockGameData,
        mockReadStatus,
        mockCardOwnership
      )

      setFilter({ cardType: 'produce' })
      expect(filteredStories.value.length).toBe(3)

      setFilter({ rarity: 'SSR' }) // 既存のcardTypeは保持される
      expect(filteredStories.value.length).toBeGreaterThan(0)
      filteredStories.value.forEach(story => {
        expect('produceCardId' in story).toBe(true)
      })
    })

    it('clearFilterでフィルタ条件をクリアできる', () => {
      const { filteredStories, setFilter, clearFilter } = useStories(
        mockRepository,
        mockGameData,
        mockReadStatus,
        mockCardOwnership
      )

      setFilter({ cardType: 'produce', rarity: 'SSR' })
      expect(filteredStories.value.length).toBeLessThan(8)

      clearFilter()
      expect(filteredStories.value).toHaveLength(8)
    })
  })
})
