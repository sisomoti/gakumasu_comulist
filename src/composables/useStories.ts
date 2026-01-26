import { computed } from 'vue'
import type { IStoryRepository } from '../services/interfaces/IStoryRepository'
import type { ExternalGameData, Story, ProduceCardStory, SupportCardStory } from '../types/domain'
import type { useReadStatus } from './useReadStatus'
import type { useCardOwnership } from './useCardOwnership'

/**
 * ストーリーデータの管理、フィルタリング、検索機能を提供するcomposable
 *
 * StoryRepositoryと連携して、UI層で使いやすい形でストーリーデータを提供する。
 *
 * @param repository ストーリーリポジトリ
 * @param gameData 外部ゲームデータ（カード情報、アイドル情報など）
 * @param readStatus 読了状態管理のcomposable
 * @param cardOwnership カード所持状態管理のcomposable
 * @returns ストーリーデータを管理する関数群
 */
export function useStories(
  repository: IStoryRepository,
  gameData: ExternalGameData,
  readStatus: ReturnType<typeof useReadStatus>,
  cardOwnership: ReturnType<typeof useCardOwnership>
) {
  /**
   * すべてのストーリーを取得する
   */
  const allStories = computed<Story[]>(() => {
    return repository.getAllStories()
  })

  /**
   * すべてのプロデュースカードストーリーを取得する
   */
  const produceCardStories = computed<ProduceCardStory[]>(() => {
    return repository.getAllProduceCardStories()
  })

  /**
   * すべてのサポートカードストーリーを取得する
   */
  const supportCardStories = computed<SupportCardStory[]>(() => {
    return repository.getAllSupportCardStories()
  })

  return {
    allStories,
    produceCardStories,
    supportCardStories,
  }
}
