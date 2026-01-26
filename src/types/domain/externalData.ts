import type { Idol } from './idol'
import type { ProduceCard } from './card'
import type { SupportCard } from './card'
import type { ProduceCardStory, SupportCardStory } from './story'

/**
 * ExternalGameData（外部ゲームデータ）
 *
 * 外部データソース（JSONファイルなど）から取得したゲームデータ全体を表すコンテナ型。
 * アイドル、カード、ストーリーなどのゲームデータを含む。
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
