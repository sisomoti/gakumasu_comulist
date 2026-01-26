import type { IStoryRepository } from '../interfaces/IStoryRepository'
import type {
  Story,
  ProduceCardStory,
  SupportCardStory,
  ExternalGameData,
} from '../../types/domain'

/**
 * ストーリーリポジトリの実装
 *
 * ExternalGameDataからストーリーを取得・検索するための実装。
 * SOLID原則のSingle Responsibility Principle (SRP) に準拠。
 * IStoryRepositoryインターフェースを実装して、Liskov Substitution Principle (LSP) に準拠。
 */
export class StoryRepository implements IStoryRepository {
  private readonly storiesData: ExternalGameData

  /**
   * StoryRepositoryのコンストラクタ
   * @param storiesData 外部ゲームデータ
   */
  constructor(storiesData: ExternalGameData) {
    this.storiesData = storiesData
  }

  /**
   * すべてのプロデュースカードストーリーを取得する
   * @returns プロデュースカードストーリーの配列
   */
  getAllProduceCardStories(): ProduceCardStory[] {
    return [...this.storiesData.produceCardStories]
  }

  /**
   * すべてのサポートカードストーリーを取得する
   * @returns サポートカードストーリーの配列
   */
  getAllSupportCardStories(): SupportCardStory[] {
    return [...this.storiesData.supportCardStories]
  }

  /**
   * すべてのストーリーを取得する
   * @returns 全種類のストーリーの配列
   */
  getAllStories(): Story[] {
    return [...this.storiesData.produceCardStories, ...this.storiesData.supportCardStories]
  }

  /**
   * ストーリーIDでストーリーを検索する
   * @param storyId ストーリーID
   * @returns 見つかったストーリー。見つからない場合はundefined
   */
  findById(storyId: string): Story | undefined {
    const produceStory = this.storiesData.produceCardStories.find(story => story.id === storyId)
    if (produceStory) {
      return produceStory
    }

    const supportStory = this.storiesData.supportCardStories.find(story => story.id === storyId)
    return supportStory
  }

  /**
   * プロデュースカードIDでストーリーを検索する
   * @param produceCardId プロデュースカードID
   * @returns 該当するプロデュースカードストーリーの配列
   */
  findByProduceCardId(produceCardId: string): ProduceCardStory[] {
    return this.storiesData.produceCardStories.filter(
      story => story.produceCardId === produceCardId
    )
  }

  /**
   * サポートカードIDでストーリーを検索する
   * @param supportCardId サポートカードID
   * @returns 該当するサポートカードストーリーの配列
   */
  findBySupportCardId(supportCardId: string): SupportCardStory[] {
    return this.storiesData.supportCardStories.filter(
      story => story.supportCardId === supportCardId
    )
  }
}
