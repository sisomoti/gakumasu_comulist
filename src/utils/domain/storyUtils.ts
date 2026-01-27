import type { Story, ExternalGameData } from '../../types/domain'
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

/**
 * Storyから主となるIdolのIDを取得する
 *
 * ProduceCardStoryとSupportCardStoryを透過的に扱うためのユーティリティ関数。
 * ProduceCardStoryの場合はidolId、SupportCardStoryの場合はmainIdolIdを返す。
 *
 * @param story ストーリーオブジェクト
 * @param gameData 外部ゲームデータ（カード情報を含む）
 * @returns 主となるアイドルのID、見つからない場合はundefined
 *
 * @example
 * const idolId = getMainIdolIdFromStory(story, gameData)
 * if (idolId) {
 *   // アイドルIDでフィルタリング
 * }
 */
export function getMainIdolIdFromStory(
  story: Story,
  gameData: ExternalGameData
): string | undefined {
  if (isProduceCardStory(story)) {
    const card = gameData.produceCards.find(card => card.id === story.produceCardId)
    return card?.idolId
  } else if (isSupportCardStory(story)) {
    const card = gameData.supportCards.find(card => card.id === story.supportCardId)
    return card?.mainIdolId
  }
  return undefined
}

/**
 * Storyから参加しているすべてのIdolのIDを取得する
 *
 * ProduceCardStoryとSupportCardStoryを透過的に扱うためのユーティリティ関数。
 * ProduceCardStoryの場合は[idolId]を返す。
 * SupportCardStoryの場合は[mainIdolId, ...appearingIdolIds]を返す。
 *
 * @param story ストーリーオブジェクト
 * @param gameData 外部ゲームデータ（カード情報を含む）
 * @returns 参加しているアイドルのIDの配列、見つからない場合は空配列
 *
 * @example
 * const idolIds = getAppearingIdolIdsFromStory(story, gameData)
 * if (idolIds.includes(targetIdolId)) {
 *   // 特定のアイドルが参加しているストーリーをフィルタリング
 * }
 */
export function getAppearingIdolIdsFromStory(story: Story, gameData: ExternalGameData): string[] {
  if (isProduceCardStory(story)) {
    const card = gameData.produceCards.find(card => card.id === story.produceCardId)
    return card?.idolId ? [card.idolId] : []
  } else if (isSupportCardStory(story)) {
    const card = gameData.supportCards.find(card => card.id === story.supportCardId)
    if (!card) return []
    return [card.mainIdolId, ...card.appearingIdolIds]
  }
  return []
}
