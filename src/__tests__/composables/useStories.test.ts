import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStories } from '../../composables/useStories'
import { StoryRepository } from '../../services/repository/StoryRepository'
import { useReadStatus } from '../../composables/useReadStatus'
import { useCardOwnership } from '../../composables/useCardOwnership'
import type { ExternalGameData } from '../../types/domain'
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
})
