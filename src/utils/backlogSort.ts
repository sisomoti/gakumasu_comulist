import type { Story, ExternalGameData } from '../types/domain'
import type { Rarity } from '../types/domain/card'
import { getMainIdolIdFromStory, getCardFromStory } from './domain/storyUtils'

const RARITY_ORDER: Record<Rarity, number> = {
  SSR: 0,
  SR: 1,
  R: 2,
}

function rarityRank(rarity: Rarity | undefined): number {
  if (!rarity) return 999
  return RARITY_ORDER[rarity] ?? 999
}

/**
 * アイドル順でストーリーIDをソートする。
 * 順序: アイドル単位でまとめる → アイドル内でレアリティ順 (SSR → SR → R) → 同一レアリティはストーリーID順。
 *
 * @param storyIds ソート対象のストーリーIDリスト
 * @param storiesMap storyId → Story のマップ（getCardFromStory 等に必要）
 * @param gameData 外部ゲームデータ（アイドル・カード情報）
 * @returns ソート済み storyId の配列
 */
export function sortByIdolOrder(
  storyIds: string[],
  storiesMap: Map<string, Story>,
  gameData: ExternalGameData
): string[] {
  const idolsOrder = gameData.idols.map(i => i.id)

  return [...storyIds].sort((aId, bId) => {
    const a = storiesMap.get(aId)
    const b = storiesMap.get(bId)
    if (!a || !b) return (a ? 1 : 0) - (b ? 1 : 0)

    const aIdolId = getMainIdolIdFromStory(a, gameData) ?? ''
    const bIdolId = getMainIdolIdFromStory(b, gameData) ?? ''
    const aIdolIndex = idolsOrder.indexOf(aIdolId)
    const bIdolIndex = idolsOrder.indexOf(bIdolId)
    const idolCompare =
      (aIdolIndex === -1 ? 999 : aIdolIndex) - (bIdolIndex === -1 ? 999 : bIdolIndex)
    if (idolCompare !== 0) return idolCompare

    const aCard = getCardFromStory(a, gameData)
    const bCard = getCardFromStory(b, gameData)
    const aRarity = aCard?.rarity
    const bRarity = bCard?.rarity
    const rarityCompare =
      rarityRank(aRarity as Rarity | undefined) - rarityRank(bRarity as Rarity | undefined)
    if (rarityCompare !== 0) return rarityCompare

    return a.id.localeCompare(b.id)
  })
}
