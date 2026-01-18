import { describe, it, expect, beforeEach } from 'vitest'
import { StoryRepository } from '../../services/repository/StoryRepository'
import type { StoriesData } from '../../types/domain'

describe('StoryRepository', () => {
  let repository: StoryRepository
  let mockStoriesData: StoriesData

  beforeEach(() => {
    mockStoriesData = {
      version: '1.0.0',
      lastUpdated: '2024-01-01T00:00:00Z',
      idols: [],
      produceCards: [
        { id: 'produce-1', name: 'プロデュースカード1', idolId: 'idol-1', rarity: 'SSR' },
        { id: 'produce-2', name: 'プロデュースカード2', idolId: 'idol-2', rarity: 'SR' }
      ],
      supportCards: [
        { id: 'support-1', name: 'サポートカード1', mainIdolId: 'idol-1', appearingIdolIds: [], rarity: 'SSR' },
        { id: 'support-2', name: 'サポートカード2', mainIdolId: 'idol-2', appearingIdolIds: [], rarity: 'SR' }
      ],
      produceCardStories: [
        { id: 'produce-1-story-1', produceCardId: 'produce-1', storyIndex: 1 },
        { id: 'produce-1-story-2', produceCardId: 'produce-1', storyIndex: 2 },
        { id: 'produce-1-story-3', produceCardId: 'produce-1', storyIndex: 3 }
      ],
      supportCardStories: [
        { id: 'support-1-story-1', supportCardId: 'support-1', storyIndex: 1 },
        { id: 'support-1-story-2', supportCardId: 'support-1', storyIndex: 2 },
        { id: 'support-1-story-3', supportCardId: 'support-1', storyIndex: 3 },
        { id: 'support-2-story-1', supportCardId: 'support-2', storyIndex: 1 },
        { id: 'support-2-story-2', supportCardId: 'support-2', storyIndex: 2 }
      ]
    }

    repository = new StoryRepository(mockStoriesData)
  })

  describe('getAllProduceCardStories', () => {
    it('すべてのプロデュースカードストーリーを取得できる', () => {
      const result = repository.getAllProduceCardStories()

      expect(result).toHaveLength(3)
      expect(result[0].id).toBe('produce-1-story-1')
      expect(result[1].id).toBe('produce-1-story-2')
      expect(result[2].id).toBe('produce-1-story-3')
    })

    it('プロデュースカードストーリーが存在しない場合は空配列を返す', () => {
      const emptyData: StoriesData = {
        ...mockStoriesData,
        produceCardStories: []
      }
      const emptyRepository = new StoryRepository(emptyData)

      const result = emptyRepository.getAllProduceCardStories()

      expect(result).toEqual([])
    })
  })

  describe('getAllSupportCardStories', () => {
    it('すべてのサポートカードストーリーを取得できる', () => {
      const result = repository.getAllSupportCardStories()

      expect(result).toHaveLength(5)
      expect(result[0].id).toBe('support-1-story-1')
      expect(result[4].id).toBe('support-2-story-2')
    })

    it('サポートカードストーリーが存在しない場合は空配列を返す', () => {
      const emptyData: StoriesData = {
        ...mockStoriesData,
        supportCardStories: []
      }
      const emptyRepository = new StoryRepository(emptyData)

      const result = emptyRepository.getAllSupportCardStories()

      expect(result).toEqual([])
    })
  })

  describe('getAllStories', () => {
    it('すべてのストーリー（プロデュースカードストーリーとサポートカードストーリー）を取得できる', () => {
      const result = repository.getAllStories()

      expect(result).toHaveLength(8) // 3 + 5
      expect(result.some(s => s.id === 'produce-1-story-1')).toBe(true)
      expect(result.some(s => s.id === 'support-1-story-1')).toBe(true)
    })

    it('ストーリーが存在しない場合は空配列を返す', () => {
      const emptyData: StoriesData = {
        ...mockStoriesData,
        produceCardStories: [],
        supportCardStories: []
      }
      const emptyRepository = new StoryRepository(emptyData)

      const result = emptyRepository.getAllStories()

      expect(result).toEqual([])
    })
  })

  describe('findById', () => {
    it('プロデュースカードストーリーIDでストーリーを検索できる', () => {
      const result = repository.findById('produce-1-story-2')

      expect(result).toBeDefined()
      expect(result?.id).toBe('produce-1-story-2')
      expect(result?.produceCardId).toBe('produce-1')
      expect(result?.storyIndex).toBe(2)
    })

    it('サポートカードストーリーIDでストーリーを検索できる', () => {
      const result = repository.findById('support-2-story-1')

      expect(result).toBeDefined()
      expect(result?.id).toBe('support-2-story-1')
      expect('supportCardId' in result && result.supportCardId).toBe('support-2')
      expect(result?.storyIndex).toBe(1)
    })

    it('存在しないストーリーIDの場合はundefinedを返す', () => {
      const result = repository.findById('non-existent-story')

      expect(result).toBeUndefined()
    })
  })

  describe('findByProduceCardId', () => {
    it('プロデュースカードIDでストーリーを検索できる', () => {
      const result = repository.findByProduceCardId('produce-1')

      expect(result).toHaveLength(3)
      expect(result.every(s => s.produceCardId === 'produce-1')).toBe(true)
      expect(result.map(s => s.storyIndex)).toEqual([1, 2, 3])
    })

    it('存在しないプロデュースカードIDの場合は空配列を返す', () => {
      const result = repository.findByProduceCardId('non-existent-produce-card')

      expect(result).toEqual([])
    })

    it('ストーリーが存在しないプロデュースカードIDの場合は空配列を返す', () => {
      const result = repository.findByProduceCardId('produce-2')

      expect(result).toEqual([])
    })
  })

  describe('findBySupportCardId', () => {
    it('サポートカードIDでストーリーを検索できる', () => {
      const result = repository.findBySupportCardId('support-1')

      expect(result).toHaveLength(3)
      expect(result.every(s => s.supportCardId === 'support-1')).toBe(true)
      expect(result.map(s => s.storyIndex)).toEqual([1, 2, 3])
    })

    it('複数のストーリーを持つサポートカードIDで検索できる', () => {
      const result = repository.findBySupportCardId('support-2')

      expect(result).toHaveLength(2)
      expect(result.every(s => s.supportCardId === 'support-2')).toBe(true)
      expect(result.map(s => s.storyIndex)).toEqual([1, 2])
    })

    it('存在しないサポートカードIDの場合は空配列を返す', () => {
      const result = repository.findBySupportCardId('non-existent-support-card')

      expect(result).toEqual([])
    })
  })

  describe('IStoryRepositoryインターフェース準拠', () => {
    it('IStoryRepositoryインターフェースのすべてのメソッドを実装している', () => {
      expect(typeof repository.getAllProduceCardStories).toBe('function')
      expect(typeof repository.getAllSupportCardStories).toBe('function')
      expect(typeof repository.getAllStories).toBe('function')
      expect(typeof repository.findById).toBe('function')
      expect(typeof repository.findByProduceCardId).toBe('function')
      expect(typeof repository.findBySupportCardId).toBe('function')
    })
  })
})
