import { describe, it, expect } from 'vitest'
import { getCardIdFromStory } from '../../../utils/domain/storyUtils'
import type { ProduceCardStory, SupportCardStory, Story } from '../../../types/domain'

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
})
