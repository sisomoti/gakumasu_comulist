import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ManualDataSource } from '../../services/data-source/ManualDataSource'
import { StoryRepository } from '../../services/repository/StoryRepository'
import { useStories } from '../../composables/useStories'
import { useReadStatus } from '../../composables/useReadStatus'
import { useCardOwnership } from '../../composables/useCardOwnership'
import { LocalStorageService } from '../../services/storage/LocalStorageService'
import type { ExternalGameData } from '../../types/domain'

// fetchをモック化
;(globalThis as any).fetch = vi.fn()

/**
 * 結合テスト: Composables連携
 *
 * useStories + useReadStatus + useCardOwnership の連携をテストする
 */
describe('統合テスト: Composables連携', () => {
  let dataSource: ManualDataSource
  let repository: StoryRepository
  let gameData: ExternalGameData
  let storageService: LocalStorageService
  let readStatus: ReturnType<typeof useReadStatus>
  let cardOwnership: ReturnType<typeof useCardOwnership>
  let stories: ReturnType<typeof useStories>

  beforeEach(async () => {
    // fetchモックをリセット
    vi.clearAllMocks()

    // ダミーデータを準備
    const mockIdolsData = {
      version: '1.0.0-dummy',
      lastUpdated: '2024-01-01T00:00:00.000Z',
      idols: [
        { id: 'idol-1', name: '天海春香' },
        { id: 'idol-2', name: '如月千早' },
        { id: 'idol-3', name: '星井美希' },
        { id: 'idol-4', name: '高槻やよい' },
        { id: 'idol-5', name: '萩原雪歩' },
      ],
    }

    const mockProduceCardsData = {
      version: '1.0.0-dummy',
      lastUpdated: '2024-01-01T00:00:00.000Z',
      produceCards: [
        { id: 'produce-ssr-1', name: '春香 SSR', idolId: 'idol-1', rarity: 'SSR' },
        { id: 'produce-ssr-2', name: '千早 SSR', idolId: 'idol-2', rarity: 'SSR' },
        { id: 'produce-sr-1', name: '美希 SR', idolId: 'idol-3', rarity: 'SR' },
        { id: 'produce-r-1', name: 'やよい R', idolId: 'idol-4', rarity: 'R' },
      ],
    }

    const mockSupportCardsData = {
      version: '1.0.0-dummy',
      lastUpdated: '2024-01-01T00:00:00.000Z',
      supportCards: [
        {
          id: 'support-ssr-1',
          name: '春香×千早 SSR',
          mainIdolId: 'idol-1',
          appearingIdolIds: ['idol-2'],
          rarity: 'SSR',
        },
        {
          id: 'support-ssr-2',
          name: '美希×やよい SSR',
          mainIdolId: 'idol-3',
          appearingIdolIds: ['idol-4'],
          rarity: 'SSR',
        },
        {
          id: 'support-sr-1',
          name: '雪歩 SR',
          mainIdolId: 'idol-5',
          appearingIdolIds: [],
          rarity: 'SR',
        },
        {
          id: 'support-r-1',
          name: 'やよい R',
          mainIdolId: 'idol-4',
          appearingIdolIds: [],
          rarity: 'R',
        },
      ],
    }

    // fetchモックを設定
    vi.mocked(globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockIdolsData,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProduceCardsData,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSupportCardsData,
      } as Response)

    // 各テスト前にストレージをクリア
    storageService = new LocalStorageService()
    storageService.clear()

    // データソースからデータを取得
    dataSource = new ManualDataSource('dummy')
    const result = await dataSource.fetchCards()

    // ExternalGameDataを構築
    gameData = {
      version: result.idols[0] ? '1.0.0-dummy' : '1.0.0',
      lastUpdated: new Date().toISOString(),
      idols: result.idols,
      produceCards: result.produceCards,
      supportCards: result.supportCards,
      produceCardStories: result.produceCardStories,
      supportCardStories: result.supportCardStories,
    }

    // リポジトリを作成
    repository = new StoryRepository(gameData)

    // Composablesを初期化
    readStatus = useReadStatus(storageService)
    cardOwnership = useCardOwnership(storageService)
    stories = useStories(repository, gameData, readStatus, cardOwnership)
  })

  afterEach(() => {
    // 各テスト後にストレージをクリア
    storageService.clear()
  })

  describe('useStories + useReadStatus', () => {
    it('未読フィルタが読了状態と正しく連携する', () => {
      const { filteredStories, setFilter } = stories

      // すべてのストーリーを取得
      const allStories = stories.allStories.value
      expect(allStories.length).toBeGreaterThan(0)

      // 一部のストーリーを読了済みにする
      if (allStories.length >= 2) {
        readStatus.setRead(allStories[0].id, true)
        readStatus.setRead(allStories[1].id, true)
      }

      // 未読フィルタを適用
      setFilter({ unreadOnly: true })

      // 読了済みのストーリーが除外されていることを確認
      const filtered = filteredStories.value
      if (allStories.length >= 2) {
        expect(filtered.some(s => s.id === allStories[0].id)).toBe(false)
        expect(filtered.some(s => s.id === allStories[1].id)).toBe(false)
        expect(filtered.length).toBe(allStories.length - 2)
      }
    })

    it('読了状態を変更するとフィルタ結果がリアクティブに更新される', () => {
      const { filteredStories, setFilter } = stories

      // 未読フィルタを適用
      setFilter({ unreadOnly: true })
      const initialCount = filteredStories.value.length

      // ストーリーを読了済みにする
      if (filteredStories.value.length > 0) {
        const firstStory = filteredStories.value[0]
        readStatus.setRead(firstStory.id, true)

        // フィルタ結果が更新されていることを確認
        expect(filteredStories.value.length).toBe(initialCount - 1)
        expect(filteredStories.value.some(s => s.id === firstStory.id)).toBe(false)
      }
    })
  })

  describe('useStories + useCardOwnership', () => {
    it('所持カードフィルタが所持状態と正しく連携する', () => {
      const { filteredStories, setFilter } = stories

      // すべてのストーリーを取得
      const allStories = stories.allStories.value
      expect(allStories.length).toBeGreaterThan(0)

      // 一部のカードを所持状態にする
      const firstStory = allStories[0]
      const cardId =
        'produceCardId' in firstStory ? firstStory.produceCardId : firstStory.supportCardId

      cardOwnership.setOwned(cardId, true)

      // 所持カードフィルタを適用
      setFilter({ ownedOnly: true })

      // 所持カードのストーリーのみが表示されることを確認
      const filtered = filteredStories.value
      expect(filtered.length).toBeGreaterThan(0)
      filtered.forEach(story => {
        const storyCardId = 'produceCardId' in story ? story.produceCardId : story.supportCardId
        expect(cardOwnership.isOwned(storyCardId)).toBe(true)
      })
    })

    it('所持状態を変更するとフィルタ結果がリアクティブに更新される', () => {
      const { filteredStories, setFilter } = stories

      // 所持カードフィルタを適用
      setFilter({ ownedOnly: true })
      const initialCount = filteredStories.value.length

      // カードを所持状態にする
      if (stories.allStories.value.length > 0) {
        const firstStory = stories.allStories.value[0]
        const cardId =
          'produceCardId' in firstStory ? firstStory.produceCardId : firstStory.supportCardId

        cardOwnership.setOwned(cardId, true)

        // フィルタ結果が更新されていることを確認
        expect(filteredStories.value.length).toBeGreaterThanOrEqual(initialCount)
      }
    })
  })

  describe('useStories + useReadStatus + useCardOwnership', () => {
    it('未読フィルタと所持カードフィルタを同時に適用できる', () => {
      const { filteredStories, setFilter } = stories

      // 一部のカードを所持状態にする
      const allStories = stories.allStories.value
      if (allStories.length >= 2) {
        const firstStory = allStories[0]
        const secondStory = allStories[1]

        const firstCardId =
          'produceCardId' in firstStory ? firstStory.produceCardId : firstStory.supportCardId
        const secondCardId =
          'produceCardId' in secondStory ? secondStory.produceCardId : secondStory.supportCardId

        cardOwnership.setOwned(firstCardId, true)
        cardOwnership.setOwned(secondCardId, true)

        // 一部のストーリーを読了済みにする
        readStatus.setRead(firstStory.id, true)

        // 未読フィルタと所持カードフィルタを同時に適用
        setFilter({ unreadOnly: true, ownedOnly: true })

        // フィルタ結果を確認
        const filtered = filteredStories.value
        filtered.forEach(story => {
          // 未読であることを確認
          expect(readStatus.isRead(story.id)).toBe(false)

          // 所持カードであることを確認
          const storyCardId = 'produceCardId' in story ? story.produceCardId : story.supportCardId
          expect(cardOwnership.isOwned(storyCardId)).toBe(true)
        })
      }
    })

    it('複数のフィルタ条件を組み合わせて使用できる', () => {
      const { filteredStories, setFilter } = stories

      // カードタイプ、レアリティ、所持状態、読了状態を設定
      if (gameData.produceCards.length > 0) {
        const firstCard = gameData.produceCards[0]
        cardOwnership.setOwned(firstCard.id, true)

        // 複数のフィルタ条件を適用
        setFilter({
          cardType: 'produce',
          rarity: firstCard.rarity,
          ownedOnly: true,
          unreadOnly: true,
        })

        // フィルタ結果を確認
        const filtered = filteredStories.value
        filtered.forEach(story => {
          // プロデュースカードであることを確認
          expect('produceCardId' in story).toBe(true)

          // 指定したレアリティであることを確認
          const card = gameData.produceCards.find(c => c.id === (story as any).produceCardId)
          expect(card?.rarity).toBe(firstCard.rarity)

          // 所持カードであることを確認
          expect(cardOwnership.isOwned(card!.id)).toBe(true)

          // 未読であることを確認
          expect(readStatus.isRead(story.id)).toBe(false)
        })
      }
    })
  })

  describe('リアクティビティ', () => {
    it('読了状態の変更がフィルタ結果に反映される', () => {
      const { filteredStories, setFilter } = stories

      setFilter({ unreadOnly: true })
      const initialUnreadCount = filteredStories.value.length

      // ストーリーを読了済みにする
      if (filteredStories.value.length > 0) {
        const story = filteredStories.value[0]
        readStatus.setRead(story.id, true)

        // フィルタ結果が自動的に更新されることを確認
        expect(filteredStories.value.length).toBe(initialUnreadCount - 1)
      }
    })

    it('所持状態の変更がフィルタ結果に反映される', () => {
      const { filteredStories, setFilter } = stories

      setFilter({ ownedOnly: true })
      const initialOwnedCount = filteredStories.value.length

      // 新しいカードを所持状態にする
      if (stories.allStories.value.length > 0) {
        const story = stories.allStories.value[0]
        const cardId = 'produceCardId' in story ? story.produceCardId : story.supportCardId

        if (!cardOwnership.isOwned(cardId)) {
          cardOwnership.setOwned(cardId, true)

          // フィルタ結果が自動的に更新されることを確認
          expect(filteredStories.value.length).toBeGreaterThanOrEqual(initialOwnedCount)
        }
      }
    })
  })
})
