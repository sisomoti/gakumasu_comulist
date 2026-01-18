import type {
  Idol,
  ProduceCard,
  SupportCard,
  ProduceCardStory,
  SupportCardStory
} from '../../types/domain'

/**
 * データ取得結果
 */
export interface DataSourceResult {
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

/**
 * データソースのインターフェース
 * 
 * 外部データソースからの取得を抽象化する。
 * スクレイピング実装と手動入力実装の両方に対応する。
 * 
 * SOLID原則:
 * - Dependency Inversion Principle (DIP): インターフェースに依存し、実装は注入可能
 * - Liskov Substitution Principle (LSP): インターフェースの実装は置き換え可能
 * - Open/Closed Principle (OCP): 新しいデータ取得方法を追加しても既存コードを変更しない
 */
export interface IDataSource {
  /**
   * カードデータを取得する
   * 
   * ProduceCardとSupportCardの実データを外部から取得する。
   * 
   * @returns データ取得結果
   * @throws {Error} データ取得に失敗した場合
   */
  fetchCards(): Promise<DataSourceResult>
  
  /**
   * アイドルデータを取得する（将来の拡張用）
   * 
   * @returns アイドル一覧
   * @throws {Error} データ取得に失敗した場合
   */
  fetchIdols?(): Promise<Idol[]>
}
