import { computed, ref } from 'vue'
import type { IStoryRepository } from '../services/interfaces/IStoryRepository'
import type {
  ExternalGameData,
  Story,
  ProduceCardStory,
  SupportCardStory,
  Rarity,
} from '../types/domain'
import type { useReadStatus } from './useReadStatus'
import type { useCardOwnership } from './useCardOwnership'

/**
 * ストーリーフィルタ条件
 */
export interface StoryFilter {
  /** カードタイプ（プロデュース/サポート） */
  cardType?: 'produce' | 'support'
  /** レアリティ（単一または複数） */
  rarity?: Rarity | Rarity[]
  /** 未読のみ表示 */
  unreadOnly?: boolean
  /** 所持カードのみ表示 */
  ownedOnly?: boolean
  /** 特定のアイドルのストーリーのみ */
  idolIds?: string[]
}

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
   * フィルタ条件
   */
  const filter = ref<StoryFilter>({})

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

  /**
   * フィルタ条件を適用したストーリー一覧
   */
  const filteredStories = computed<Story[]>(() => {
    let stories = allStories.value

    // カードタイプでフィルタ
    if (filter.value.cardType === 'produce') {
      stories = stories.filter((s): s is ProduceCardStory => 'produceCardId' in s)
    } else if (filter.value.cardType === 'support') {
      stories = stories.filter((s): s is SupportCardStory => 'supportCardId' in s)
    }

    // レアリティでフィルタ
    if (filter.value.rarity !== undefined) {
      const rarities = Array.isArray(filter.value.rarity)
        ? filter.value.rarity
        : [filter.value.rarity]
      stories = stories.filter(story => {
        const card = getCardFromStory(story)
        return card && rarities.includes(card.rarity)
      })
    }

    // 未読のみでフィルタ
    if (filter.value.unreadOnly === true) {
      stories = stories.filter(story => !readStatus.isRead(story.id))
    }

    // 所持カードのみでフィルタ
    if (filter.value.ownedOnly === true) {
      stories = stories.filter(story => {
        const card = getCardFromStory(story)
        return card && cardOwnership.isOwned(card.id)
      })
    }

    // アイドルIDでフィルタ
    if (filter.value.idolIds && filter.value.idolIds.length > 0) {
      stories = stories.filter(story => {
        const card = getCardFromStory(story)
        if (!card) return false

        if ('idolId' in card) {
          // ProduceCard
          return filter.value.idolIds!.includes(card.idolId)
        } else if ('mainIdolId' in card) {
          // SupportCard
          return (
            filter.value.idolIds!.includes(card.mainIdolId) ||
            card.appearingIdolIds.some(id => filter.value.idolIds!.includes(id))
          )
        }
        return false
      })
    }

    return stories
  })

  /**
   * ストーリーからカード情報を取得する
   */
  function getCardFromStory(story: Story) {
    if ('produceCardId' in story) {
      return gameData.produceCards.find(card => card.id === story.produceCardId)
    } else if ('supportCardId' in story) {
      return gameData.supportCards.find(card => card.id === story.supportCardId)
    }
    return undefined
  }

  /**
   * フィルタ条件を設定する（重ねがけ対応）
   * @param newFilter 追加または更新するフィルタ条件
   */
  function setFilter(newFilter: Partial<StoryFilter>): void {
    filter.value = { ...filter.value, ...newFilter }
  }

  /**
   * フィルタ条件をクリアする
   */
  function clearFilter(): void {
    filter.value = {}
  }

  return {
    allStories,
    produceCardStories,
    supportCardStories,
    filteredStories,
    filter,
    setFilter,
    clearFilter,
  }
}
