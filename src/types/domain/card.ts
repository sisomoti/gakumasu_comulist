/**
 * レアリティの型定義
 */
export type Rarity = 'SSR' | 'SR' | 'R'

/**
 * IdolCard（アイドルカード）の基底型
 * 
 * ProduceCardとSupportCardの共通属性を定義する。
 */
export interface IdolCard {
  /** カードのユニークID */
  id: string
  
  /** カード名 */
  name: string
  
  /** レアリティ */
  rarity: Rarity
}

/**
 * ProduceCard（プロデュース・カード）
 * 
 * アイドルの様子を描いたカードの一種。
 * 1人のアイドルに紐づく。
 */
export interface ProduceCard extends IdolCard {
  /** 対象となるアイドルのID（必須、1:1） */
  idolId: string
}

/**
 * SupportCard（サポート・カード）
 * 
 * アイドルの様子を描いたカードの一種。
 * 主のアイドルの他に、登場人物として他のアイドルも複数人出てくることがある。
 */
export interface SupportCard extends IdolCard {
  /** 主となるアイドルのID（必須、1:1） */
  mainIdolId: string
  
  /** 登場人物として登場するアイドルのIDリスト（0..*） */
  appearingIdolIds: string[]
}
