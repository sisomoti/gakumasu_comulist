import type {
  ProduceCardStory,
  SupportCardStory,
  StoriesData
} from '../../types/domain'

/**
 * ストーリーリポジトリのインターフェース
 * 
 * StoriesDataからストーリーを取得・検索するためのインターフェース。
 * SOLID原則のDependency Inversion Principle (DIP) に準拠。
 */
export interface IStoryRepository {
  /**
   * すべてのプロデュースカードストーリーを取得する
   * @returns プロデュースカードストーリーの配列
   */
  getAllProduceCardStories(): ProduceCardStory[]

  /**
   * すべてのサポートカードストーリーを取得する
   * @returns サポートカードストーリーの配列
   */
  getAllSupportCardStories(): SupportCardStory[]

  /**
   * すべてのストーリーを取得する
   * @returns プロデュースカードストーリーとサポートカードストーリーの配列
   */
  getAllStories(): (ProduceCardStory | SupportCardStory)[]

  /**
   * ストーリーIDでストーリーを検索する
   * @param storyId ストーリーID
   * @returns 見つかったストーリー。見つからない場合はundefined
   */
  findById(storyId: string): ProduceCardStory | SupportCardStory | undefined

  /**
   * プロデュースカードIDでストーリーを検索する
   * @param produceCardId プロデュースカードID
   * @returns 該当するプロデュースカードストーリーの配列
   */
  findByProduceCardId(produceCardId: string): ProduceCardStory[]

  /**
   * サポートカードIDでストーリーを検索する
   * @param supportCardId サポートカードID
   * @returns 該当するサポートカードストーリーの配列
   */
  findBySupportCardId(supportCardId: string): SupportCardStory[]
}
