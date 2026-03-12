/**
 * Phase5: バックログ用の型定義
 */

import type { Rarity } from './card'

/** バックログのランク（数値が小さいほど優先度が高い） */
export type BacklogRank = number

/**
 * バックログ上の区分（アジャイルの Product Backlog / Sprint Backlog に相当）
 * - sprintBacklog: スプリントバックログの候補（直近で読みたいもの）
 * - productBacklog: プロダクトバックログ（近い内に読みたいもの、Rank 順）
 * - outOfScope: プロダクトバックログの範囲外（計画外。rank で表示順を保存）
 */
export type BacklogSection = 'sprintBacklog' | 'productBacklog' | 'outOfScope'

/**
 * バックログアイテム
 * 管理単位は拡張可能。現時点ではストーリーと1対1で紐づける（storyId で参照）
 */
export interface BacklogItem {
  /** ストーリーID */
  storyId: string
  /** ランク（小さいほど優先度が高い）。全 section で rank 順に表示・保存する。 */
  rank: number
  /** どの区分に属するか（スプリントバックログの候補 / プロダクトバックログ / 範囲外） */
  section: BacklogSection
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
