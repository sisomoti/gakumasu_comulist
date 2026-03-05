/**
 * Phase5: バックログ用の型定義
 */

import type { Rarity } from './card'

/** バックログのランク（数値が小さいほど優先度が高い） */
export type BacklogRank = number

/**
 * バックログアイテム
 * 管理単位は拡張可能。Phase5 ではストーリーのみ利用（storyId で参照）
 */
export interface BacklogItem {
  /** ストーリーID */
  storyId: string
  /** ランク（小さいほど優先度が高い） */
  rank: number
  /** 計画済みかどうか（false の場合は未計画セクションに表示） */
  isPlanned: boolean
}

/**
 * バックログのフィルター条件（表示の絞り込み専用）
 * useStories の StoryFilter と揃えた構造。フィルター適用だけでは計画済みにしない。
 */
export interface BacklogFilter {
  /** カードタイプ（プロデュース/サポート） */
  cardType?: 'produce' | 'support'
  /** レアリティ（単一または複数） */
  rarity?: Rarity | Rarity[]
  /** 未読のみ表示 */
  unreadOnly?: boolean
  /** 特定のアイドルのストーリーのみ */
  idolIds?: string[]
  /** 検索クエリ（カード名またはアイドル名で部分一致検索） */
  searchQuery?: string
  /** ソートキー */
  sortBy?: 'name' | 'rarity' | 'idolId' | 'cardId'
  /** ソート順 */
  sortOrder?: 'asc' | 'desc'
}
