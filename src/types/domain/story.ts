import type { Idol } from './idol'
import type { ProduceCard } from './card'
import type { SupportCard } from './card'

/**
 * Story（ストーリー）の基底型
 * 
 * 将来の拡張用（親愛度コミュ、育成シナリオ、初星コミュ、イベントコミュなど）
 */
export interface Story {
  /** ストーリーのユニークID */
  id: string
}

/**
 * ProduceCardStory（プロデュース・カード・ストーリー）
 * 
 * ProduceCardに紐づくストーリー。
 */
export interface ProduceCardStory extends Story {
  /** 紐づくProduceCardのID */
  produceCardId: string
  
  /** ストーリーのインデックス（1, 2, 3） */
  storyIndex: number
}

/**
 * SupportCardStory（サポート・カード・ストーリー）
 * 
 * SupportCardに紐づくストーリー。
 */
export interface SupportCardStory extends Story {
  /** 紐づくSupportCardのID */
  supportCardId: string
  
  /** ストーリーのインデックス（1, 2, 3） */
  storyIndex: number
}

/**
 * ストーリーデータの構造
 * 
 * 外部から取得するカードデータとストーリーデータを含む。
 */
export interface StoriesData {
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
