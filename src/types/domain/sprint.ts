/**
 * Phase5: スプリント・カンバン用の型定義
 */

/** 目標期間の型（1週間 / 2週間 / 1ヶ月 / なし） */
export type SprintPeriod = '1week' | '2weeks' | '1month' | 'none'

/** スプリント情報 */
export interface Sprint {
  /** スプリントの一意識別子 */
  id: string
  /** 開始日（ISO 8601形式） */
  startDate: string
  /** 終了日（ISO 8601形式）。null の場合は無期限 */
  endDate: string | null
  /** 目標期間 */
  targetPeriod: SprintPeriod
  /** アクティブなスプリントかどうか */
  isActive: boolean
  /** スプリントに含まれるストーリーIDのリスト */
  storyIds: string[]
}

/** カンバンの列（バケット） */
export type KanbanBucket = 'unread' | 'in-progress' | 'read'

/** カンバン上のアイテム */
export interface KanbanItem {
  /** ストーリーID */
  storyId: string
  /** 所属する列 */
  bucket: KanbanBucket
  /** 列内での表示順序 */
  order: number
}
