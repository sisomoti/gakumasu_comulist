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
 * 結合テスト: データフローの統合
 *
 * ManualDataSource → StoryRepository → useStories の連携をテストする
 */
describe('統合テスト: データフロー', () => {
  let dataSource: ManualDataSource
  let repository: StoryRepository
  let gameData: ExternalGameData
  let storageService: LocalStorageService
  let readStatus: ReturnType<typeof useReadStatus>
  let cardOwnership: ReturnType<typeof useCardOwnership>

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
  })

  afterEach(() => {
    // 各テスト後にストレージをクリア
    storageService.clear()
  })

  describe('ManualDataSource → StoryRepository → useStories', () => {
    it('データソースから取得したデータがリポジトリを通じてuseStoriesで使用できる', () => {
      const { allStories, produceCardStories, supportCardStories } = useStories(
        repository,
        gameData,
        readStatus,
        cardOwnership
      )

      // ストーリーが正しく取得できることを確認
      expect(allStories.value.length).toBeGreaterThan(0)
      expect(produceCardStories.value.length).toBeGreaterThan(0)
      expect(supportCardStories.value.length).toBeGreaterThan(0)

      // プロデュースカードストーリーとサポートカードストーリーの合計が一致することを確認
      expect(allStories.value.length).toBe(
        produceCardStories.value.length + supportCardStories.value.length
      )
    })

    it('ストーリーが正しく生成されている（SSRカードは3ストーリー、SRは2ストーリー、Rは1ストーリー）', () => {
      const { produceCardStories, supportCardStories } = useStories(
        repository,
        gameData,
        readStatus,
        cardOwnership
      )

      // SSRカードのストーリー数を確認
      const ssrProduceCards = gameData.produceCards.filter(card => card.rarity === 'SSR')
      const ssrSupportCards = gameData.supportCards.filter(card => card.rarity === 'SSR')

      // SSRプロデュースカードは各3ストーリー
      const ssrProduceStories = produceCardStories.value.filter(story =>
        ssrProduceCards.some(card => card.id === story.produceCardId)
      )
      expect(ssrProduceStories.length).toBe(ssrProduceCards.length * 3)

      // SSRサポートカードは各3ストーリー
      const ssrSupportStories = supportCardStories.value.filter(story =>
        ssrSupportCards.some(card => card.id === story.supportCardId)
      )
      expect(ssrSupportStories.length).toBe(ssrSupportCards.length * 3)

      // SRカードのストーリー数を確認
      const srProduceCards = gameData.produceCards.filter(card => card.rarity === 'SR')
      const srSupportCards = gameData.supportCards.filter(card => card.rarity === 'SR')

      // SRプロデュースカードは各2ストーリー
      const srProduceStories = produceCardStories.value.filter(story =>
        srProduceCards.some(card => card.id === story.produceCardId)
      )
      expect(srProduceStories.length).toBe(srProduceCards.length * 2)

      // SRサポートカードは各2ストーリー
      const srSupportStories = supportCardStories.value.filter(story =>
        srSupportCards.some(card => card.id === story.supportCardId)
      )
      expect(srSupportStories.length).toBe(srSupportCards.length * 2)

      // Rカードのストーリー数を確認
      const rProduceCards = gameData.produceCards.filter(card => card.rarity === 'R')
      const rSupportCards = gameData.supportCards.filter(card => card.rarity === 'R')

      // Rプロデュースカードは各1ストーリー
      const rProduceStories = produceCardStories.value.filter(story =>
        rProduceCards.some(card => card.id === story.produceCardId)
      )
      expect(rProduceStories.length).toBe(rProduceCards.length * 1)

      // Rサポートカードは各1ストーリー
      const rSupportStories = supportCardStories.value.filter(story =>
        rSupportCards.some(card => card.id === story.supportCardId)
      )
      expect(rSupportStories.length).toBe(rSupportCards.length * 1)
    })

    it('リポジトリのfindByIdメソッドが正しく動作する', () => {
      const { allStories } = useStories(repository, gameData, readStatus, cardOwnership)

      if (allStories.value.length > 0) {
        const firstStory = allStories.value[0]
        const foundStory = repository.findById(firstStory.id)

        expect(foundStory).toBeDefined()
        expect(foundStory?.id).toBe(firstStory.id)
      }
    })

    it('リポジトリのfindByProduceCardIdメソッドが正しく動作する', () => {
      if (gameData.produceCards.length > 0) {
        const firstCard = gameData.produceCards[0]
        const stories = repository.findByProduceCardId(firstCard.id)

        expect(stories.length).toBeGreaterThan(0)
        stories.forEach(story => {
          expect(story.produceCardId).toBe(firstCard.id)
        })
      }
    })

    it('リポジトリのfindBySupportCardIdメソッドが正しく動作する', () => {
      if (gameData.supportCards.length > 0) {
        const firstCard = gameData.supportCards[0]
        const stories = repository.findBySupportCardId(firstCard.id)

        expect(stories.length).toBeGreaterThan(0)
        stories.forEach(story => {
          expect(story.supportCardId).toBe(firstCard.id)
        })
      }
    })
  })
})
