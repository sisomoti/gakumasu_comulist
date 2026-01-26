import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ManualDataSource } from '../../services/data-source/ManualDataSource'
import {
  calculateProduceCardStoryCount,
  calculateSupportCardStoryCount,
} from '../../utils/domain/storyCountCalculator'

// fetchをモック化
global.fetch = vi.fn()

describe('ManualDataSource', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('コンストラクタ', () => {
    it('データソースタイプを指定できること', () => {
      const dataSource = new ManualDataSource('dummy')
      expect(dataSource).toBeInstanceOf(ManualDataSource)
    })

    it('dummyとproductionの両方を受け付けること', () => {
      const dummySource = new ManualDataSource('dummy')
      const productionSource = new ManualDataSource('production')
      expect(dummySource).toBeInstanceOf(ManualDataSource)
      expect(productionSource).toBeInstanceOf(ManualDataSource)
    })
  })

  describe('fetchCards', () => {
    it('3つのJSONファイルを並列で読み込むこと', async () => {
      const mockIdolsData = {
        version: '1.0.0-dummy',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        idols: [{ id: 'idol-1', name: '天海春香' }],
      }

      const mockProduceCardsData = {
        version: '1.0.0-dummy',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        produceCards: [{ id: 'produce-ssr-1', name: '春香 SSR', idolId: 'idol-1', rarity: 'SSR' }],
      }

      const mockSupportCardsData = {
        version: '1.0.0-dummy',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        supportCards: [
          {
            id: 'support-ssr-1',
            name: '千早 SSR',
            mainIdolId: 'idol-2',
            appearingIdolIds: [],
            rarity: 'SSR',
          },
        ],
      }

      vi.mocked(fetch)
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

      const dataSource = new ManualDataSource('dummy')
      await dataSource.fetchCards()

      expect(fetch).toHaveBeenCalledTimes(3)
      expect(fetch).toHaveBeenCalledWith('/external-data/dummy/idols.json')
      expect(fetch).toHaveBeenCalledWith('/external-data/dummy/produceCards.json')
      expect(fetch).toHaveBeenCalledWith('/external-data/dummy/supportCards.json')
    })

    it('正しいデータ構造を返すこと', async () => {
      const mockIdolsData = {
        version: '1.0.0-dummy',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        idols: [{ id: 'idol-1', name: '天海春香' }],
      }

      const mockProduceCardsData = {
        version: '1.0.0-dummy',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        produceCards: [{ id: 'produce-ssr-1', name: '春香 SSR', idolId: 'idol-1', rarity: 'SSR' }],
      }

      const mockSupportCardsData = {
        version: '1.0.0-dummy',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        supportCards: [
          {
            id: 'support-ssr-1',
            name: '千早 SSR',
            mainIdolId: 'idol-2',
            appearingIdolIds: [],
            rarity: 'SSR',
          },
        ],
      }

      vi.mocked(fetch)
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

      const dataSource = new ManualDataSource('dummy')
      const result = await dataSource.fetchCards()

      expect(result).toHaveProperty('idols')
      expect(result).toHaveProperty('produceCards')
      expect(result).toHaveProperty('supportCards')
      expect(result).toHaveProperty('produceCardStories')
      expect(result).toHaveProperty('supportCardStories')
      expect(result.idols).toEqual(mockIdolsData.idols)
      expect(result.produceCards).toEqual(mockProduceCardsData.produceCards)
      expect(result.supportCards).toEqual(mockSupportCardsData.supportCards)
    })

    it('ストーリーが内部的に生成されること', async () => {
      const mockIdolsData = {
        version: '1.0.0-dummy',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        idols: [{ id: 'idol-1', name: '天海春香' }],
      }

      const mockProduceCardsData = {
        version: '1.0.0-dummy',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        produceCards: [{ id: 'produce-ssr-1', name: '春香 SSR', idolId: 'idol-1', rarity: 'SSR' }],
      }

      const mockSupportCardsData = {
        version: '1.0.0-dummy',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        supportCards: [
          {
            id: 'support-ssr-1',
            name: '千早 SSR',
            mainIdolId: 'idol-2',
            appearingIdolIds: [],
            rarity: 'SSR',
          },
        ],
      }

      vi.mocked(fetch)
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

      const dataSource = new ManualDataSource('dummy')
      const result = await dataSource.fetchCards()

      // SSRのProduceCardには3話のストーリーが生成される
      expect(result.produceCardStories).toHaveLength(3)
      expect(result.produceCardStories[0].produceCardId).toBe('produce-ssr-1')
      expect(result.produceCardStories[0].storyIndex).toBe(1)
      expect(result.produceCardStories[1].storyIndex).toBe(2)
      expect(result.produceCardStories[2].storyIndex).toBe(3)

      // SSRのSupportCardには3話のストーリーが生成される
      expect(result.supportCardStories).toHaveLength(3)
      expect(result.supportCardStories[0].supportCardId).toBe('support-ssr-1')
      expect(result.supportCardStories[0].storyIndex).toBe(1)
      expect(result.supportCardStories[1].storyIndex).toBe(2)
      expect(result.supportCardStories[2].storyIndex).toBe(3)
    })

    it('ストーリー数がビジネスルールに従っていること', async () => {
      const mockIdolsData = {
        version: '1.0.0-dummy',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        idols: [
          { id: 'idol-1', name: '天海春香' },
          { id: 'idol-2', name: '如月千早' },
        ],
      }

      const mockProduceCardsData = {
        version: '1.0.0-dummy',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        produceCards: [
          { id: 'produce-ssr-1', name: '春香 SSR', idolId: 'idol-1', rarity: 'SSR' },
          { id: 'produce-sr-1', name: '千早 SR', idolId: 'idol-2', rarity: 'SR' },
          { id: 'produce-r-1', name: '美希 R', idolId: 'idol-3', rarity: 'R' },
        ],
      }

      const mockSupportCardsData = {
        version: '1.0.0-dummy',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        supportCards: [
          {
            id: 'support-ssr-1',
            name: '春香 SSR',
            mainIdolId: 'idol-1',
            appearingIdolIds: [],
            rarity: 'SSR',
          },
          {
            id: 'support-sr-1',
            name: '千早 SR',
            mainIdolId: 'idol-2',
            appearingIdolIds: [],
            rarity: 'SR',
          },
          {
            id: 'support-r-1',
            name: '美希 R',
            mainIdolId: 'idol-3',
            appearingIdolIds: [],
            rarity: 'R',
          },
        ],
      }

      vi.mocked(fetch)
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

      const dataSource = new ManualDataSource('dummy')
      const result = await dataSource.fetchCards()

      // ProduceCard: SSR=3話、SR・R=0話
      const produceSSRCard = result.produceCards.find(c => c.id === 'produce-ssr-1')
      const produceSRCard = result.produceCards.find(c => c.id === 'produce-sr-1')
      const produceRCard = result.produceCards.find(c => c.id === 'produce-r-1')

      expect(produceSSRCard).toBeDefined()
      expect(produceSRCard).toBeDefined()
      expect(produceRCard).toBeDefined()

      const produceSSRStories = result.produceCardStories.filter(
        s => s.produceCardId === 'produce-ssr-1'
      )
      const produceSRStories = result.produceCardStories.filter(
        s => s.produceCardId === 'produce-sr-1'
      )
      const produceRStories = result.produceCardStories.filter(
        s => s.produceCardId === 'produce-r-1'
      )

      expect(produceSSRStories).toHaveLength(calculateProduceCardStoryCount(produceSSRCard!))
      expect(produceSRStories).toHaveLength(calculateProduceCardStoryCount(produceSRCard!))
      expect(produceRStories).toHaveLength(calculateProduceCardStoryCount(produceRCard!))

      // SupportCard: SSR=3話、SR・R=2話
      const supportSSRCard = result.supportCards.find(c => c.id === 'support-ssr-1')
      const supportSRCard = result.supportCards.find(c => c.id === 'support-sr-1')
      const supportRCard = result.supportCards.find(c => c.id === 'support-r-1')

      expect(supportSSRCard).toBeDefined()
      expect(supportSRCard).toBeDefined()
      expect(supportRCard).toBeDefined()

      const supportSSRStories = result.supportCardStories.filter(
        s => s.supportCardId === 'support-ssr-1'
      )
      const supportSRStories = result.supportCardStories.filter(
        s => s.supportCardId === 'support-sr-1'
      )
      const supportRStories = result.supportCardStories.filter(
        s => s.supportCardId === 'support-r-1'
      )

      expect(supportSSRStories).toHaveLength(calculateSupportCardStoryCount(supportSSRCard!))
      expect(supportSRStories).toHaveLength(calculateSupportCardStoryCount(supportSRCard!))
      expect(supportRStories).toHaveLength(calculateSupportCardStoryCount(supportRCard!))
    })

    it('ストーリーIDが正しい形式で生成されること', async () => {
      const mockIdolsData = {
        version: '1.0.0-dummy',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        idols: [{ id: 'idol-1', name: '天海春香' }],
      }

      const mockProduceCardsData = {
        version: '1.0.0-dummy',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        produceCards: [{ id: 'produce-ssr-1', name: '春香 SSR', idolId: 'idol-1', rarity: 'SSR' }],
      }

      const mockSupportCardsData = {
        version: '1.0.0-dummy',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        supportCards: [
          {
            id: 'support-ssr-1',
            name: '千早 SSR',
            mainIdolId: 'idol-2',
            appearingIdolIds: [],
            rarity: 'SSR',
          },
        ],
      }

      vi.mocked(fetch)
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

      const dataSource = new ManualDataSource('dummy')
      const result = await dataSource.fetchCards()

      // ProduceCardStory: ProduceCard-{cardId}-story-{index} 形式
      expect(result.produceCardStories[0].id).toBe('ProduceCard-produce-ssr-1-story-1')
      expect(result.produceCardStories[1].id).toBe('ProduceCard-produce-ssr-1-story-2')
      expect(result.produceCardStories[2].id).toBe('ProduceCard-produce-ssr-1-story-3')

      // SupportCardStory: SupportCard-{cardId}-story-{index} 形式
      expect(result.supportCardStories[0].id).toBe('SupportCard-support-ssr-1-story-1')
      expect(result.supportCardStories[1].id).toBe('SupportCard-support-ssr-1-story-2')
      expect(result.supportCardStories[2].id).toBe('SupportCard-support-ssr-1-story-3')
    })

    it('カードとストーリーの関連が正しいこと', async () => {
      const mockIdolsData = {
        version: '1.0.0-dummy',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        idols: [{ id: 'idol-1', name: '天海春香' }],
      }

      const mockProduceCardsData = {
        version: '1.0.0-dummy',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        produceCards: [
          { id: 'produce-ssr-1', name: '春香 SSR', idolId: 'idol-1', rarity: 'SSR' },
          { id: 'produce-ssr-2', name: '千早 SSR', idolId: 'idol-2', rarity: 'SSR' },
        ],
      }

      const mockSupportCardsData = {
        version: '1.0.0-dummy',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        supportCards: [
          {
            id: 'support-ssr-1',
            name: '春香 SSR',
            mainIdolId: 'idol-1',
            appearingIdolIds: [],
            rarity: 'SSR',
          },
          {
            id: 'support-ssr-2',
            name: '千早 SSR',
            mainIdolId: 'idol-2',
            appearingIdolIds: [],
            rarity: 'SSR',
          },
        ],
      }

      vi.mocked(fetch)
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

      const dataSource = new ManualDataSource('dummy')
      const result = await dataSource.fetchCards()

      // 各カードのストーリーが正しく関連付けられているか確認
      const produceCard1Stories = result.produceCardStories.filter(
        s => s.produceCardId === 'produce-ssr-1'
      )
      const produceCard2Stories = result.produceCardStories.filter(
        s => s.produceCardId === 'produce-ssr-2'
      )

      expect(produceCard1Stories).toHaveLength(3)
      expect(produceCard2Stories).toHaveLength(3)
      produceCard1Stories.forEach(story => {
        expect(story.produceCardId).toBe('produce-ssr-1')
      })
      produceCard2Stories.forEach(story => {
        expect(story.produceCardId).toBe('produce-ssr-2')
      })

      const supportCard1Stories = result.supportCardStories.filter(
        s => s.supportCardId === 'support-ssr-1'
      )
      const supportCard2Stories = result.supportCardStories.filter(
        s => s.supportCardId === 'support-ssr-2'
      )

      expect(supportCard1Stories).toHaveLength(3)
      expect(supportCard2Stories).toHaveLength(3)
      supportCard1Stories.forEach(story => {
        expect(story.supportCardId).toBe('support-ssr-1')
      })
      supportCard2Stories.forEach(story => {
        expect(story.supportCardId).toBe('support-ssr-2')
      })
    })

    it('productionデータソースタイプで正しいパスから読み込むこと', async () => {
      const mockIdolsData = {
        version: '1.0.0',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        idols: [{ id: 'idol-1', name: '天海春香' }],
      }

      const mockProduceCardsData = {
        version: '1.0.0',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        produceCards: [{ id: 'produce-ssr-1', name: '春香 SSR', idolId: 'idol-1', rarity: 'SSR' }],
      }

      const mockSupportCardsData = {
        version: '1.0.0',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        supportCards: [
          {
            id: 'support-ssr-1',
            name: '千早 SSR',
            mainIdolId: 'idol-2',
            appearingIdolIds: [],
            rarity: 'SSR',
          },
        ],
      }

      vi.mocked(fetch)
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

      const dataSource = new ManualDataSource('production')
      await dataSource.fetchCards()

      expect(fetch).toHaveBeenCalledWith('/external-data/production/idols.json')
      expect(fetch).toHaveBeenCalledWith('/external-data/production/produceCards.json')
      expect(fetch).toHaveBeenCalledWith('/external-data/production/supportCards.json')
    })

    it('エラー時に適切なエラーを投げること', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const dataSource = new ManualDataSource('dummy')
      await expect(dataSource.fetchCards()).rejects.toThrow('Network error')
    })

    it('HTTPエラー時に適切なエラーを投げること', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response)

      const dataSource = new ManualDataSource('dummy')
      await expect(dataSource.fetchCards()).rejects.toThrow()
    })
  })

  describe('fetchIdols', () => {
    it('アイドル一覧を返すこと', async () => {
      const mockIdolsData = {
        version: '1.0.0-dummy',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        idols: [
          { id: 'idol-1', name: '天海春香' },
          { id: 'idol-2', name: '如月千早' },
        ],
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockIdolsData,
      } as Response)

      const dataSource = new ManualDataSource('dummy')
      const result = await dataSource.fetchIdols()

      expect(result).toEqual(mockIdolsData.idols)
      expect(fetch).toHaveBeenCalledWith('/external-data/dummy/idols.json')
    })
  })
})
