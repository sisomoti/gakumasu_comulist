import type { Rarity, ProduceCard, SupportCard } from '../../types/domain'

/**
 * カードタイプ
 */
export type CardType = 'produce' | 'support'

/**
 * レアリティとカードタイプからストーリー数を計算する
 * 
 * ビジネスルール:
 * - ProduceCard: SSR=3話、SR・R=0話
 * - SupportCard: SSR=3話、SR・R=2話
 * 
 * @param cardType カードタイプ（'produce' | 'support'）
 * @param rarity レアリティ（'SSR' | 'SR' | 'R'）
 * @returns ストーリー数
 */
export function calculateStoryCount(cardType: CardType, rarity: Rarity): number {
  if (cardType === 'produce') {
    // ProduceCard: SSR=3話、SR・R=0話
    return rarity === 'SSR' ? 3 : 0
  } else {
    // SupportCard: SSR=3話、SR・R=2話
    return rarity === 'SSR' ? 3 : 2
  }
}

/**
 * ProduceCardからストーリー数を計算する
 * 
 * @param card ProduceCard
 * @returns ストーリー数
 */
export function calculateProduceCardStoryCount(card: ProduceCard): number {
  return calculateStoryCount('produce', card.rarity)
}

/**
 * SupportCardからストーリー数を計算する
 * 
 * @param card SupportCard
 * @returns ストーリー数
 */
export function calculateSupportCardStoryCount(card: SupportCard): number {
  return calculateStoryCount('support', card.rarity)
}
