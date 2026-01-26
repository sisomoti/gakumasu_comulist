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
 * 結合テスト: ロジック層シナリオ
 *
 * 実際のユースケースに基づいたロジック層のシナリオをテストする。
 * UI層を含まない、ビジネスロジックとデータフローの統合テスト。
 *
 * テスト対象:
 * - ManualDataSource → StoryRepository → Composables の連携
 * - ユースケースシナリオ（所持カードの未読ストーリー確認など）
 * - データの永続化
 *
 * 注意: このテストはロジック層のみを対象としており、UIコンポーネントは含まれない。
 * UIを含むE2Eテストは、UI実装後に別途作成する予定。
 */
describe('統合テスト: ロジック層シナリオ', () => {
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

  describe('シナリオ1: 所持カードの未読ストーリーを確認する', () => {
    it('所持しているカードの未読ストーリーのみを表示できる', () => {
      const { filteredStories, setFilter } = stories

      // 一部のカードを所持状態にする
      if (gameData.produceCards.length > 0) {
        const firstCard = gameData.produceCards[0]
        cardOwnership.setOwned(firstCard.id, true)

        // 一部のストーリーを読了済みにする
        const cardStories = repository.findByProduceCardId(firstCard.id)
        if (cardStories.length > 0) {
          readStatus.setRead(cardStories[0].id, true)
        }

        // 所持カードかつ未読のフィルタを適用
        setFilter({ ownedOnly: true, unreadOnly: true })

        // フィルタ結果を確認
        const filtered = filteredStories.value
        expect(filtered.length).toBeGreaterThan(0)

        filtered.forEach(story => {
          // 所持カードのストーリーであることを確認
          const cardId =
            'produceCardId' in story ? (story as any).produceCardId : (story as any).supportCardId
          expect(cardOwnership.isOwned(cardId)).toBe(true)

          // 未読であることを確認
          expect(readStatus.isRead(story.id)).toBe(false)
        })
      }
    })
  })

  describe('シナリオ2: 特定のアイドルのストーリーを検索する', () => {
    it('特定のアイドルのストーリーを検索して表示できる', () => {
      const { filteredStories, setFilter } = stories

      if (gameData.idols.length > 0) {
        const firstIdol = gameData.idols[0]

        // アイドルIDでフィルタ
        setFilter({ idolIds: [firstIdol.id] })

        // フィルタ結果を確認
        const filtered = filteredStories.value
        expect(filtered.length).toBeGreaterThan(0)

        filtered.forEach(story => {
          const card =
            'produceCardId' in story
              ? gameData.produceCards.find(c => c.id === (story as any).produceCardId)
              : gameData.supportCards.find(c => c.id === (story as any).supportCardId)

          if (card) {
            if ('idolId' in card) {
              // ProduceCard
              expect(card.idolId).toBe(firstIdol.id)
            } else if ('mainIdolId' in card) {
              // SupportCard
              expect(
                card.mainIdolId === firstIdol.id || card.appearingIdolIds.includes(firstIdol.id)
              ).toBe(true)
            }
          }
        })
      }
    })

    it('アイドル名で検索できる', () => {
      const { filteredStories, setFilter } = stories

      if (gameData.idols.length > 0) {
        const firstIdol = gameData.idols[0]

        // アイドル名で検索
        setFilter({ searchQuery: firstIdol.name })

        // フィルタ結果を確認
        const filtered = filteredStories.value
        expect(filtered.length).toBeGreaterThan(0)

        filtered.forEach(story => {
          const card =
            'produceCardId' in story
              ? gameData.produceCards.find(c => c.id === (story as any).produceCardId)
              : gameData.supportCards.find(c => c.id === (story as any).supportCardId)

          if (card) {
            // カード名またはアイドル名に一致することを確認
            const isCardNameMatch = card.name.includes(firstIdol.name)
            const isIdolNameMatch =
              ('idolId' in card &&
                gameData.idols.find(i => i.id === card.idolId)?.name === firstIdol.name) ||
              ('mainIdolId' in card &&
                gameData.idols.find(i => i.id === card.mainIdolId)?.name === firstIdol.name)

            expect(isCardNameMatch || isIdolNameMatch).toBe(true)
          }
        })
      }
    })
  })

  describe('シナリオ3: SSRカードの未読ストーリーを確認する', () => {
    it('SSRカードの未読ストーリーのみを表示できる', () => {
      const { filteredStories, setFilter } = stories

      // SSRかつ未読のフィルタを適用
      setFilter({ rarity: 'SSR', unreadOnly: true })

      // フィルタ結果を確認
      const filtered = filteredStories.value
      expect(filtered.length).toBeGreaterThan(0)

      filtered.forEach(story => {
        // SSRカードであることを確認
        const card =
          'produceCardId' in story
            ? gameData.produceCards.find(c => c.id === (story as any).produceCardId)
            : gameData.supportCards.find(c => c.id === (story as any).supportCardId)

        expect(card?.rarity).toBe('SSR')

        // 未読であることを確認
        expect(readStatus.isRead(story.id)).toBe(false)
      })
    })
  })

  describe('シナリオ4: ストーリーを読了済みにする', () => {
    it('ストーリーを読了済みにすると未読フィルタから除外される', () => {
      const { filteredStories, setFilter } = stories

      // 未読フィルタを適用
      setFilter({ unreadOnly: true })
      const initialUnreadCount = filteredStories.value.length

      // ストーリーを読了済みにする
      if (filteredStories.value.length > 0) {
        const story = filteredStories.value[0]
        readStatus.setRead(story.id, true)

        // フィルタ結果から除外されることを確認
        expect(filteredStories.value.length).toBe(initialUnreadCount - 1)
        expect(filteredStories.value.some(s => s.id === story.id)).toBe(false)
      }
    })

    it('読了済みストーリーを未読に戻せる', () => {
      const { filteredStories, setFilter } = stories

      // ストーリーを読了済みにする
      if (stories.allStories.value.length > 0) {
        const story = stories.allStories.value[0]
        readStatus.setRead(story.id, true)
        expect(readStatus.isRead(story.id)).toBe(true)

        // 未読に戻す
        readStatus.setRead(story.id, false)
        expect(readStatus.isRead(story.id)).toBe(false)

        // 未読フィルタで表示されることを確認
        setFilter({ unreadOnly: true })
        expect(filteredStories.value.some(s => s.id === story.id)).toBe(true)
      }
    })
  })

  describe('シナリオ5: 複合的な検索とフィルタリング', () => {
    it('複数の条件を組み合わせてストーリーを検索できる', () => {
      const { filteredStories, setFilter } = stories

      // 複数の条件を組み合わせる
      if (gameData.produceCards.length > 0 && gameData.idols.length > 0) {
        const firstCard = gameData.produceCards[0]
        const firstIdol = gameData.idols[0]

        // カードを所持状態にする
        cardOwnership.setOwned(firstCard.id, true)

        setFilter({
          cardType: 'produce',
          rarity: firstCard.rarity,
          ownedOnly: true,
          unreadOnly: true,
          idolIds: [firstIdol.id],
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

          // 指定したアイドルのカードであることを確認
          expect(card?.idolId).toBe(firstIdol.id)
        })
      }
    })

    it('検索クエリとフィルタを組み合わせて使用できる', () => {
      const { filteredStories, setFilter } = stories

      if (gameData.produceCards.length > 0) {
        const firstCard = gameData.produceCards[0]

        // 検索クエリとフィルタを組み合わせる
        setFilter({
          searchQuery: firstCard.name.substring(0, 2), // カード名の一部
          cardType: 'produce',
          rarity: firstCard.rarity,
        })

        // フィルタ結果を確認
        const filtered = filteredStories.value
        expect(filtered.length).toBeGreaterThan(0)

        filtered.forEach(story => {
          // プロデュースカードであることを確認
          expect('produceCardId' in story).toBe(true)

          // 指定したレアリティであることを確認
          const card = gameData.produceCards.find(c => c.id === (story as any).produceCardId)
          expect(card?.rarity).toBe(firstCard.rarity)

          // 検索クエリに一致することを確認
          expect(
            card?.name.includes(firstCard.name.substring(0, 2)) ||
              gameData.idols
                .find(i => i.id === card?.idolId)
                ?.name.includes(firstCard.name.substring(0, 2))
          ).toBe(true)
        })
      }
    })
  })

  describe('シナリオ6: データの永続化', () => {
    it('読了状態と所持状態がローカルストレージに保存され、再読み込み時に復元される', () => {
      // 初期状態でデータを設定
      if (stories.allStories.value.length > 0) {
        const story = stories.allStories.value[0]
        const cardId =
          'produceCardId' in story ? (story as any).produceCardId : (story as any).supportCardId

        readStatus.setRead(story.id, true)
        cardOwnership.setOwned(cardId, true)

        // 新しいインスタンスを作成（ローカルストレージから読み込む）
        const newStorageService = new LocalStorageService()
        const newReadStatus = useReadStatus(newStorageService)
        const newCardOwnership = useCardOwnership(newStorageService)

        // データが復元されていることを確認
        expect(newReadStatus.isRead(story.id)).toBe(true)
        expect(newCardOwnership.isOwned(cardId)).toBe(true)
      }
    })
  })
})
