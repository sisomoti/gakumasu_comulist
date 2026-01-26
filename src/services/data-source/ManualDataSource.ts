import type { IDataSource, DataSourceResult } from './IDataSource'
import type {
  Idol,
  ProduceCard,
  SupportCard,
  ProduceCardStory,
  SupportCardStory,
  IdolsData,
  ProduceCardsData,
  SupportCardsData,
} from '../../types/domain'
import {
  calculateProduceCardStoryCount,
  calculateSupportCardStoryCount,
} from '../../utils/domain/storyCountCalculator'
import { createProduceCardStory, createSupportCardStory } from '../../utils/storyIdGenerator'

/**
 * データソースタイプ
 */
export type DataSourceType = 'dummy' | 'production'

/**
 * ManualDataSource（手動データソース）
 *
 * JSONファイルからデータを読み込む実装。
 * 開発・テスト用のダミーデータと本番データの両方に対応する。
 *
 * SOLID原則:
 * - Single Responsibility Principle (SRP): データ取得のみを担当
 * - Dependency Inversion Principle (DIP): IDataSourceインターフェースに依存
 * - Open/Closed Principle (OCP): 新しいデータソースタイプを追加しても既存コードを変更しない
 */
export class ManualDataSource implements IDataSource {
  private readonly basePath: string

  /**
   * ManualDataSourceのコンストラクタ
   * @param dataSourceType データソースタイプ（'dummy' | 'production'）
   */
  constructor(dataSourceType: DataSourceType = 'dummy') {
    this.basePath = `/external-data/${dataSourceType}`
  }

  /**
   * カードデータを取得する
   *
   * 3つのJSONファイルを並列で読み込み、ストーリーを内部的に生成して返す。
   *
   * @returns データ取得結果
   * @throws {Error} データ取得に失敗した場合
   */
  async fetchCards(): Promise<DataSourceResult> {
    try {
      // 3つのJSONファイルを並列で読み込む
      const [idolsResponse, produceCardsResponse, supportCardsResponse] = await Promise.all([
        fetch(`${this.basePath}/idols.json`),
        fetch(`${this.basePath}/produceCards.json`),
        fetch(`${this.basePath}/supportCards.json`),
      ])

      // HTTPエラーチェック
      if (!idolsResponse.ok) {
        throw new Error(
          `Failed to fetch idols.json: ${idolsResponse.status} ${idolsResponse.statusText}`
        )
      }
      if (!produceCardsResponse.ok) {
        throw new Error(
          `Failed to fetch produceCards.json: ${produceCardsResponse.status} ${produceCardsResponse.statusText}`
        )
      }
      if (!supportCardsResponse.ok) {
        throw new Error(
          `Failed to fetch supportCards.json: ${supportCardsResponse.status} ${supportCardsResponse.statusText}`
        )
      }

      // JSONをパース
      const idolsData: IdolsData = await idolsResponse.json()
      const produceCardsData: ProduceCardsData = await produceCardsResponse.json()
      const supportCardsData: SupportCardsData = await supportCardsResponse.json()

      // ストーリーを内部的に生成
      const produceCardStories = this.generateProduceCardStories(produceCardsData.produceCards)
      const supportCardStories = this.generateSupportCardStories(supportCardsData.supportCards)

      return {
        idols: idolsData.idols,
        produceCards: produceCardsData.produceCards,
        supportCards: supportCardsData.supportCards,
        produceCardStories,
        supportCardStories,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while fetching cards')
    }
  }

  /**
   * アイドルデータを取得する
   *
   * @returns アイドル一覧
   * @throws {Error} データ取得に失敗した場合
   */
  async fetchIdols(): Promise<Idol[]> {
    try {
      const response = await fetch(`${this.basePath}/idols.json`)

      if (!response.ok) {
        throw new Error(`Failed to fetch idols.json: ${response.status} ${response.statusText}`)
      }

      const idolsData: IdolsData = await response.json()
      return idolsData.idols
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while fetching idols')
    }
  }

  /**
   * ProduceCardStoryを生成する
   *
   * 各カードのレアリティに基づいてストーリー数を計算し、ストーリーを生成する。
   *
   * @param produceCards プロデュースカード一覧
   * @returns プロデュースカードストーリー一覧
   */
  private generateProduceCardStories(produceCards: ProduceCard[]): ProduceCardStory[] {
    const stories: ProduceCardStory[] = []

    for (const card of produceCards) {
      const storyCount = calculateProduceCardStoryCount(card)

      for (let index = 1; index <= storyCount; index++) {
        stories.push(createProduceCardStory(card.id, index))
      }
    }

    return stories
  }

  /**
   * SupportCardStoryを生成する
   *
   * 各カードのレアリティに基づいてストーリー数を計算し、ストーリーを生成する。
   *
   * @param supportCards サポートカード一覧
   * @returns サポートカードストーリー一覧
   */
  private generateSupportCardStories(supportCards: SupportCard[]): SupportCardStory[] {
    const stories: SupportCardStory[] = []

    for (const card of supportCards) {
      const storyCount = calculateSupportCardStoryCount(card)

      for (let index = 1; index <= storyCount; index++) {
        stories.push(createSupportCardStory(card.id, index))
      }
    }

    return stories
  }
}
