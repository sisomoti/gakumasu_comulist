import type { Idol } from './idol'
import type { ProduceCard } from './card'
import type { SupportCard } from './card'
import type { ProduceCardStory, SupportCardStory } from './story'

/**
 * 分割されたJSONファイルの型定義
 */

/**
 * IdolsData（アイドルデータ）
 *
 * idols.jsonファイルの構造
 */
export interface IdolsData {
  /** データバージョン */
  version: string

  /** 最終更新日時 */
  lastUpdated: string

  /** アイドル一覧 */
  idols: Idol[]
}

/**
 * ProduceCardsData（プロデュースカードデータ）
 *
 * produceCards.jsonファイルの構造
 * ストーリーは含まない（DataSource実装が内部的に生成する）
 */
export interface ProduceCardsData {
  /** データバージョン */
  version: string

  /** 最終更新日時 */
  lastUpdated: string

  /** プロデュースカード一覧 */
  produceCards: ProduceCard[]
}

/**
 * SupportCardsData（サポートカードデータ）
 *
 * supportCards.jsonファイルの構造
 * ストーリーは含まない（DataSource実装が内部的に生成する）
 */
export interface SupportCardsData {
  /** データバージョン */
  version: string

  /** 最終更新日時 */
  lastUpdated: string

  /** サポートカード一覧 */
  supportCards: SupportCard[]
}

/**
 * ExternalGameData（外部ゲームデータ）
 *
 * 外部データソース（JSONファイルなど）から取得したゲームデータ全体を表すコンテナ型。
 * アイドル、カード、ストーリーなどのゲームデータを含む。
 * 分割されたJSONファイルを統合し、ストーリーを生成した後の完全なデータ構造。
 */
export interface ExternalGameData {
  /** データバージョン */
  version: string

  /** 最終更新日時 */
  lastUpdated: string

  /** アイドル一覧 */
  idols: Idol[]

  /** プロデュースカード一覧 */
  produceCards: ProduceCard[]

  /** サポートカード一覧 */
  supportCards: SupportCard[]

  /** プロデュースカードストーリー一覧 */
  produceCardStories: ProduceCardStory[]

  /** サポートカードストーリー一覧 */
  supportCardStories: SupportCardStory[]
}
