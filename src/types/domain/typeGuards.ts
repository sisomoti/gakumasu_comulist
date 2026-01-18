import type {
  Idol,
  IdolCard,
  ProduceCard,
  SupportCard,
  Story,
  ProduceCardStory,
  SupportCardStory,
  Rarity
} from './index'

/**
 * 型ガード関数
 * 
 * 実行時にオブジェクトが特定の型であるかを判定する。
 */

/**
 * オブジェクトがIdol型であるかを判定する
 * 
 * @param obj 判定するオブジェクト
 * @returns Idol型である場合true
 */
export function isIdol(obj: unknown): obj is Idol {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    typeof (obj as { id: unknown }).id === 'string' &&
    typeof (obj as { name: unknown }).name === 'string'
  )
}

/**
 * オブジェクトがRarity型であるかを判定する
 * 
 * @param obj 判定するオブジェクト
 * @returns Rarity型である場合true
 */
export function isRarity(obj: unknown): obj is Rarity {
  return obj === 'SSR' || obj === 'SR' || obj === 'R'
}

/**
 * オブジェクトがIdolCard型であるかを判定する
 * 
 * @param obj 判定するオブジェクト
 * @returns IdolCard型である場合true
 */
export function isIdolCard(obj: unknown): obj is IdolCard {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'rarity' in obj &&
    typeof (obj as { id: unknown }).id === 'string' &&
    typeof (obj as { name: unknown }).name === 'string' &&
    isRarity((obj as { rarity: unknown }).rarity)
  )
}

/**
 * オブジェクトがProduceCard型であるかを判定する
 * 
 * @param obj 判定するオブジェクト
 * @returns ProduceCard型である場合true
 */
export function isProduceCard(obj: unknown): obj is ProduceCard {
  return (
    isIdolCard(obj) &&
    'idolId' in obj &&
    typeof (obj as { idolId: unknown }).idolId === 'string'
  )
}

/**
 * オブジェクトがSupportCard型であるかを判定する
 * 
 * @param obj 判定するオブジェクト
 * @returns SupportCard型である場合true
 */
export function isSupportCard(obj: unknown): obj is SupportCard {
  return (
    isIdolCard(obj) &&
    'mainIdolId' in obj &&
    'appearingIdolIds' in obj &&
    typeof (obj as { mainIdolId: unknown }).mainIdolId === 'string' &&
    Array.isArray((obj as { appearingIdolIds: unknown }).appearingIdolIds) &&
    (obj as { appearingIdolIds: unknown[] }).appearingIdolIds.every(
      (id): id is string => typeof id === 'string'
    )
  )
}

/**
 * オブジェクトがStory型であるかを判定する
 * 
 * @param obj 判定するオブジェクト
 * @returns Story型である場合true
 */
export function isStory(obj: unknown): obj is Story {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as { id: unknown }).id === 'string'
  )
}

/**
 * オブジェクトがProduceCardStory型であるかを判定する
 * 
 * @param obj 判定するオブジェクト
 * @returns ProduceCardStory型である場合true
 */
export function isProduceCardStory(obj: unknown): obj is ProduceCardStory {
  return (
    isStory(obj) &&
    'produceCardId' in obj &&
    'storyIndex' in obj &&
    typeof (obj as { produceCardId: unknown }).produceCardId === 'string' &&
    typeof (obj as { storyIndex: unknown }).storyIndex === 'number'
  )
}

/**
 * オブジェクトがSupportCardStory型であるかを判定する
 * 
 * @param obj 判定するオブジェクト
 * @returns SupportCardStory型である場合true
 */
export function isSupportCardStory(obj: unknown): obj is SupportCardStory {
  return (
    isStory(obj) &&
    'supportCardId' in obj &&
    'storyIndex' in obj &&
    typeof (obj as { supportCardId: unknown }).supportCardId === 'string' &&
    typeof (obj as { storyIndex: unknown }).storyIndex === 'number'
  )
}
