import type {
  Idol,
  ProduceCard,
  SupportCard,
  ProduceCardStory,
  SupportCardStory,
} from '../../types/domain'
import {
  calculateProduceCardStoryCount,
  calculateSupportCardStoryCount,
} from './storyCountCalculator'

/**
 * カードデータの妥当性検証結果
 */
export interface ValidationResult {
  /** 検証が成功したかどうか */
  isValid: boolean

  /** エラーメッセージのリスト */
  errors: string[]
}

/**
 * ProduceCardの妥当性を検証する
 *
 * @param card 検証するProduceCard
 * @param idols 存在するIdolのリスト
 * @param stories 紐づくProduceCardStoryのリスト
 * @returns 検証結果
 */
export function validateProduceCard(
  card: ProduceCard,
  idols: Idol[],
  stories: ProduceCardStory[]
): ValidationResult {
  const errors: string[] = []

  // Idolの存在確認
  const idolExists = idols.some(idol => idol.id === card.idolId)
  if (!idolExists) {
    errors.push(
      `ProduceCard "${card.id}" のidolId "${card.idolId}" が存在するIdolを参照していません`
    )
  }

  // ストーリー数の整合性チェック
  const expectedStoryCount = calculateProduceCardStoryCount(card)
  const actualStoryCount = stories.filter(s => s.produceCardId === card.id).length

  if (actualStoryCount !== expectedStoryCount) {
    errors.push(
      `ProduceCard "${card.id}" のストーリー数が不正です。` +
        `期待値: ${expectedStoryCount}、実際: ${actualStoryCount}`
    )
  }

  // ストーリーのインデックスの整合性チェック
  const cardStories = stories.filter(s => s.produceCardId === card.id)
  const storyIndices = cardStories.map(s => s.storyIndex).sort()
  const expectedIndices = Array.from({ length: expectedStoryCount }, (_, i) => i + 1)

  if (expectedStoryCount > 0) {
    if (JSON.stringify(storyIndices) !== JSON.stringify(expectedIndices)) {
      errors.push(
        `ProduceCard "${card.id}" のストーリーインデックスが不正です。` +
          `期待値: [${expectedIndices.join(', ')}]、実際: [${storyIndices.join(', ')}]`
      )
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * SupportCardの妥当性を検証する
 *
 * @param card 検証するSupportCard
 * @param idols 存在するIdolのリスト
 * @param stories 紐づくSupportCardStoryのリスト
 * @returns 検証結果
 */
export function validateSupportCard(
  card: SupportCard,
  idols: Idol[],
  stories: SupportCardStory[]
): ValidationResult {
  const errors: string[] = []

  // 主Idolの存在確認
  const mainIdolExists = idols.some(idol => idol.id === card.mainIdolId)
  if (!mainIdolExists) {
    errors.push(
      `SupportCard "${card.id}" のmainIdolId "${card.mainIdolId}" が存在するIdolを参照していません`
    )
  }

  // 登場Idolの存在確認
  for (const appearingIdolId of card.appearingIdolIds) {
    const appearingIdolExists = idols.some(idol => idol.id === appearingIdolId)
    if (!appearingIdolExists) {
      errors.push(
        `SupportCard "${card.id}" のappearingIdolIdsに含まれる "${appearingIdolId}" が存在するIdolを参照していません`
      )
    }
  }

  // ストーリー数の整合性チェック
  const expectedStoryCount = calculateSupportCardStoryCount(card)
  const actualStoryCount = stories.filter(s => s.supportCardId === card.id).length

  if (actualStoryCount !== expectedStoryCount) {
    errors.push(
      `SupportCard "${card.id}" のストーリー数が不正です。` +
        `期待値: ${expectedStoryCount}、実際: ${actualStoryCount}`
    )
  }

  // ストーリーのインデックスの整合性チェック
  const cardStories = stories.filter(s => s.supportCardId === card.id)
  const storyIndices = cardStories.map(s => s.storyIndex).sort()
  const expectedIndices = Array.from({ length: expectedStoryCount }, (_, i) => i + 1)

  if (expectedStoryCount > 0) {
    if (JSON.stringify(storyIndices) !== JSON.stringify(expectedIndices)) {
      errors.push(
        `SupportCard "${card.id}" のストーリーインデックスが不正です。` +
          `期待値: [${expectedIndices.join(', ')}]、実際: [${storyIndices.join(', ')}]`
      )
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * 全てのカードデータの妥当性を検証する
 *
 * @param data ExternalGameData
 * @returns 検証結果
 */
export function validateAllCards(data: {
  idols: Idol[]
  produceCards: ProduceCard[]
  supportCards: SupportCard[]
  produceCardStories: ProduceCardStory[]
  supportCardStories: SupportCardStory[]
}): ValidationResult {
  const errors: string[] = []

  // ProduceCardの検証
  for (const card of data.produceCards) {
    const result = validateProduceCard(card, data.idols, data.produceCardStories)
    if (!result.isValid) {
      errors.push(...result.errors)
    }
  }

  // SupportCardの検証
  for (const card of data.supportCards) {
    const result = validateSupportCard(card, data.idols, data.supportCardStories)
    if (!result.isValid) {
      errors.push(...result.errors)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
