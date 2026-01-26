/**
 * Domain Model Layer
 *
 * ゲーム固有のエンティティと型定義をエクスポートする。
 */

export type { Idol } from './idol'
export type { Rarity, IdolCard, ProduceCard, SupportCard } from './card'
export type { Story, ProduceCardStory, SupportCardStory } from './story'
export type {
  ExternalGameData,
  IdolsData,
  ProduceCardsData,
  SupportCardsData,
} from './externalData'

// 型ガード関数をエクスポート
export {
  isIdol,
  isRarity,
  isIdolCard,
  isProduceCard,
  isSupportCard,
  isStory,
  isProduceCardStory,
  isSupportCardStory,
} from './typeGuards'
