import type { ProduceCardStory, SupportCardStory } from '../types/domain'

/**
 * ProduceCardStoryのIDを生成する
 *
 * 形式: `ProduceCard-{cardId}-story-{index}`
 * 例: `ProduceCard-produce-ssr-1-story-1`
 *
 * @param cardId カードID
 * @param storyIndex ストーリーインデックス（1, 2, 3）
 * @returns ストーリーID
 */
export function generateProduceCardStoryId(cardId: string, storyIndex: number): string {
  return `ProduceCard-${cardId}-story-${storyIndex}`
}

/**
 * SupportCardStoryのIDを生成する
 *
 * 形式: `SupportCard-{cardId}-story-{index}`
 * 例: `SupportCard-support-ssr-1-story-1`
 *
 * @param cardId カードID
 * @param storyIndex ストーリーインデックス（1, 2, 3）
 * @returns ストーリーID
 */
export function generateSupportCardStoryId(cardId: string, storyIndex: number): string {
  return `SupportCard-${cardId}-story-${storyIndex}`
}

/**
 * ProduceCardStoryを生成する
 *
 * @param cardId カードID
 * @param storyIndex ストーリーインデックス（1, 2, 3）
 * @returns ProduceCardStory
 */
export function createProduceCardStory(cardId: string, storyIndex: number): ProduceCardStory {
  return {
    id: generateProduceCardStoryId(cardId, storyIndex),
    produceCardId: cardId,
    storyIndex,
  }
}

/**
 * SupportCardStoryを生成する
 *
 * @param cardId カードID
 * @param storyIndex ストーリーインデックス（1, 2, 3）
 * @returns SupportCardStory
 */
export function createSupportCardStory(cardId: string, storyIndex: number): SupportCardStory {
  return {
    id: generateSupportCardStoryId(cardId, storyIndex),
    supportCardId: cardId,
    storyIndex,
  }
}
