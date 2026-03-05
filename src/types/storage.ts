/**
 * Phase5: ローカルストレージに保存するデータ構造の型定義
 *
 * 既存の readStatus / cardOwnership と同様に、キー別で保存する方針とする。
 * 使用キー: sprint, backlog, kanban
 */

import type { Sprint } from './domain/sprint'
import type { BacklogItem, BacklogFilter } from './domain/backlog'
import type { KanbanItem } from './domain/sprint'

/** スプリント情報のストレージ構造（1つのアクティブなスプリントのみ管理） */
export interface SprintStorage {
  /** アクティブなスプリント。未開始または終了後は null */
  activeSprint: Sprint | null
}

/** バックログ情報のストレージ構造 */
export interface BacklogStorage {
  /** バックログアイテム一覧 */
  items: BacklogItem[]
  /** 表示用フィルター条件 */
  filter: BacklogFilter
  /** 最終更新日時（ISO 8601形式） */
  lastUpdated: string
}

/** カンバン列の表示ON/OFF（折りたたみ）設定 */
export interface KanbanColumnVisibility {
  /** 未読列の表示 */
  unread: boolean
  /** 挑戦中列の表示 */
  inProgress: boolean
  /** 既読列の表示 */
  read: boolean
}

/** カンバン情報のストレージ構造 */
export interface KanbanStorage {
  /** カンバン上のアイテム一覧 */
  items: KanbanItem[]
  /** 関連するスプリントID */
  sprintId: string
  /** 最終更新日時（ISO 8601形式） */
  lastUpdated: string
  /** 列の表示ON/OFF設定（折りたたみ） */
  columnVisibility: KanbanColumnVisibility
}

/**
 * 読み計画まわりで使うストレージのルート型（型定義・マイグレーション用）
 * 実際の保存は sprint / backlog / kanban の3キーで行う
 */
export interface ReadingPlanStorage {
  sprint: SprintStorage
  backlog: BacklogStorage
  kanban: KanbanStorage
}

/** ローカルストレージのキー（既存の readStatus, cardOwnership と同様にキー別で保存） */
export const READING_PLAN_STORAGE_KEYS = {
  sprint: 'sprint',
  backlog: 'backlog',
  kanban: 'kanban',
} as const

export type ReadingPlanStorageKey =
  (typeof READING_PLAN_STORAGE_KEYS)[keyof typeof READING_PLAN_STORAGE_KEYS]
