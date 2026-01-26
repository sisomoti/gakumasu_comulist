import type { Story } from '../../types/domain'
import { isProduceCardStory, isSupportCardStory } from '../../types/domain'

/**
 * StoryからカードIDを取得する
 *
 * ProduceCardStoryとSupportCardStoryを透過的に扱うためのユーティリティ関数。
 * 型ガードを使用して型安全にカードIDを取得する。
 *
 * @param story ストーリーオブジェクト
 * @returns カードID
 * @throws Error Story型がProduceCardStoryでもSupportCardStoryでもない場合
 *
 * @example
 * const cardId = getCardIdFromStory(story)
 * cardOwnership.setOwned(cardId, true)
 */
export function getCardIdFromStory(story: Story): string {
  if (isProduceCardStory(story)) {
    return story.produceCardId
  } else if (isSupportCardStory(story)) {
    return story.supportCardId
  }
  throw new Error(`Invalid story type: story.id=${story.id}`)
}
