/**
 * Domain Model Layer
 * 
 * ゲーム固有のエンティティと型定義をエクスポートする。
 */

export type { Idol } from './idol'
export type { Rarity, IdolCard, ProduceCard, SupportCard } from './card'
export type {
  Story,
  ProduceCardStory,
  SupportCardStory,
  StoriesData
} from './story'

// 型ガード関数をエクスポート
export {
  isIdol,
  isRarity,
  isIdolCard,
  isProduceCard,
  isSupportCard,
  isStory,
  isProduceCardStory,
  isSupportCardStory
} from './typeGuards'
