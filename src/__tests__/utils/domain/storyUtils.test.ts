import { describe, it, expect } from 'vitest'
import {
  getCardIdFromStory,
  getMainIdolIdFromStory,
  getAppearingIdolIdsFromStory,
} from '../../../utils/domain/storyUtils'
import type {
  ProduceCardStory,
  SupportCardStory,
  Story,
  ExternalGameData,
} from '../../../types/domain'

describe('storyUtils', () => {
  describe('getCardIdFromStory', () => {
    describe('ProduceCardStoryの場合', () => {
      it('produceCardIdを返す', () => {
        const story: ProduceCardStory = {
          id: 'story-1',
          produceCardId: 'produce-card-1',
          storyIndex: 1,
        }

        const result = getCardIdFromStory(story)
        expect(result).toBe('produce-card-1')
      })

      it('異なるproduceCardIdでも正しく返す', () => {
        const story: ProduceCardStory = {
          id: 'story-2',
          produceCardId: 'produce-card-2',
          storyIndex: 2,
        }

        const result = getCardIdFromStory(story)
        expect(result).toBe('produce-card-2')
      })
    })

    describe('SupportCardStoryの場合', () => {
      it('supportCardIdを返す', () => {
        const story: SupportCardStory = {
          id: 'story-3',
          supportCardId: 'support-card-1',
          storyIndex: 1,
        }

        const result = getCardIdFromStory(story)
        expect(result).toBe('support-card-1')
      })

      it('異なるsupportCardIdでも正しく返す', () => {
        const story: SupportCardStory = {
          id: 'story-4',
          supportCardId: 'support-card-2',
          storyIndex: 2,
        }

        const result = getCardIdFromStory(story)
        expect(result).toBe('support-card-2')
      })
    })

    describe('無効なStory型の場合', () => {
      it('エラーをスローする', () => {
        const story: Story = {
          id: 'invalid-story',
        }

        expect(() => getCardIdFromStory(story)).toThrow(
          'Invalid story type: story.id=invalid-story'
        )
      })

      it('エラーメッセージにstory.idが含まれる', () => {
        const story: Story = {
          id: 'another-invalid-story',
        }

        expect(() => getCardIdFromStory(story)).toThrow(
          'Invalid story type: story.id=another-invalid-story'
        )
      })
    })
  })

  describe('getMainIdolIdFromStory', () => {
    const mockGameData: ExternalGameData = {
      version: '1.0.0',
      lastUpdated: '2024-01-01T00:00:00Z',
      idols: [
        { id: 'idol-1', name: 'アイドル1' },
        { id: 'idol-2', name: 'アイドル2' },
      ],
      produceCards: [
        {
          id: 'produce-card-1',
          name: 'プロデュースカード1',
          idolId: 'idol-1',
          rarity: 'SSR',
        },
        {
          id: 'produce-card-2',
          name: 'プロデュースカード2',
          idolId: 'idol-2',
          rarity: 'SR',
        },
      ],
      supportCards: [
        {
          id: 'support-card-1',
          name: 'サポートカード1',
          mainIdolId: 'idol-1',
          appearingIdolIds: ['idol-2'],
          rarity: 'SSR',
        },
        {
          id: 'support-card-2',
          name: 'サポートカード2',
          mainIdolId: 'idol-2',
          appearingIdolIds: [],
          rarity: 'SR',
        },
      ],
      produceCardStories: [],
      supportCardStories: [],
    }

    describe('ProduceCardStoryの場合', () => {
      it('idolIdを返す', () => {
        const story: ProduceCardStory = {
          id: 'story-1',
          produceCardId: 'produce-card-1',
          storyIndex: 1,
        }

        const result = getMainIdolIdFromStory(story, mockGameData)
        expect(result).toBe('idol-1')
      })

      it('異なるproduceCardIdでも正しくidolIdを返す', () => {
        const story: ProduceCardStory = {
          id: 'story-2',
          produceCardId: 'produce-card-2',
          storyIndex: 2,
        }

        const result = getMainIdolIdFromStory(story, mockGameData)
        expect(result).toBe('idol-2')
      })

      it('Cardが見つからない場合はundefinedを返す', () => {
        const story: ProduceCardStory = {
          id: 'story-3',
          produceCardId: 'non-existent-card',
          storyIndex: 1,
        }

        const result = getMainIdolIdFromStory(story, mockGameData)
        expect(result).toBeUndefined()
      })
    })

    describe('SupportCardStoryの場合', () => {
      it('mainIdolIdを返す', () => {
        const story: SupportCardStory = {
          id: 'story-3',
          supportCardId: 'support-card-1',
          storyIndex: 1,
        }

        const result = getMainIdolIdFromStory(story, mockGameData)
        expect(result).toBe('idol-1')
      })

      it('異なるsupportCardIdでも正しくmainIdolIdを返す', () => {
        const story: SupportCardStory = {
          id: 'story-4',
          supportCardId: 'support-card-2',
          storyIndex: 2,
        }

        const result = getMainIdolIdFromStory(story, mockGameData)
        expect(result).toBe('idol-2')
      })

      it('Cardが見つからない場合はundefinedを返す', () => {
        const story: SupportCardStory = {
          id: 'story-5',
          supportCardId: 'non-existent-card',
          storyIndex: 1,
        }

        const result = getMainIdolIdFromStory(story, mockGameData)
        expect(result).toBeUndefined()
      })
    })

    describe('無効なStory型の場合', () => {
      it('undefinedを返す', () => {
        const story: Story = {
          id: 'invalid-story',
        }

        const result = getMainIdolIdFromStory(story, mockGameData)
        expect(result).toBeUndefined()
      })
    })
  })

  describe('getAppearingIdolIdsFromStory', () => {
    const mockGameData: ExternalGameData = {
      version: '1.0.0',
      lastUpdated: '2024-01-01T00:00:00Z',
      idols: [
        { id: 'idol-1', name: 'アイドル1' },
        { id: 'idol-2', name: 'アイドル2' },
        { id: 'idol-3', name: 'アイドル3' },
      ],
      produceCards: [
        {
          id: 'produce-card-1',
          name: 'プロデュースカード1',
          idolId: 'idol-1',
          rarity: 'SSR',
        },
        {
          id: 'produce-card-2',
          name: 'プロデュースカード2',
          idolId: 'idol-2',
          rarity: 'SR',
        },
      ],
      supportCards: [
        {
          id: 'support-card-1',
          name: 'サポートカード1',
          mainIdolId: 'idol-1',
          appearingIdolIds: ['idol-2', 'idol-3'],
          rarity: 'SSR',
        },
        {
          id: 'support-card-2',
          name: 'サポートカード2',
          mainIdolId: 'idol-2',
          appearingIdolIds: [],
          rarity: 'SR',
        },
      ],
      produceCardStories: [],
      supportCardStories: [],
    }

    describe('ProduceCardStoryの場合', () => {
      it('idolIdを含む配列を返す', () => {
        const story: ProduceCardStory = {
          id: 'story-1',
          produceCardId: 'produce-card-1',
          storyIndex: 1,
        }

        const result = getAppearingIdolIdsFromStory(story, mockGameData)
        expect(result).toEqual(['idol-1'])
      })

      it('異なるproduceCardIdでも正しくidolIdを含む配列を返す', () => {
        const story: ProduceCardStory = {
          id: 'story-2',
          produceCardId: 'produce-card-2',
          storyIndex: 2,
        }

        const result = getAppearingIdolIdsFromStory(story, mockGameData)
        expect(result).toEqual(['idol-2'])
      })

      it('Cardが見つからない場合は空配列を返す', () => {
        const story: ProduceCardStory = {
          id: 'story-3',
          produceCardId: 'non-existent-card',
          storyIndex: 1,
        }

        const result = getAppearingIdolIdsFromStory(story, mockGameData)
        expect(result).toEqual([])
      })
    })

    describe('SupportCardStoryの場合', () => {
      it('mainIdolIdとappearingIdolIdsを含む配列を返す', () => {
        const story: SupportCardStory = {
          id: 'story-3',
          supportCardId: 'support-card-1',
          storyIndex: 1,
        }

        const result = getAppearingIdolIdsFromStory(story, mockGameData)
        expect(result).toEqual(['idol-1', 'idol-2', 'idol-3'])
      })

      it('appearingIdolIdsが空の場合でもmainIdolIdを含む配列を返す', () => {
        const story: SupportCardStory = {
          id: 'story-4',
          supportCardId: 'support-card-2',
          storyIndex: 2,
        }

        const result = getAppearingIdolIdsFromStory(story, mockGameData)
        expect(result).toEqual(['idol-2'])
      })

      it('Cardが見つからない場合は空配列を返す', () => {
        const story: SupportCardStory = {
          id: 'story-5',
          supportCardId: 'non-existent-card',
          storyIndex: 1,
        }

        const result = getAppearingIdolIdsFromStory(story, mockGameData)
        expect(result).toEqual([])
      })
    })

    describe('無効なStory型の場合', () => {
      it('空配列を返す', () => {
        const story: Story = {
          id: 'invalid-story',
        }

        const result = getAppearingIdolIdsFromStory(story, mockGameData)
        expect(result).toEqual([])
      })
    })
  })
})
