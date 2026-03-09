import { ref } from 'vue'
import { LocalStorageService } from '../services/storage/LocalStorageService'
import type { IStorageService } from '../services/interfaces/IStorageService'
import { useLocalStorage } from './useLocalStorage'
import type { BacklogItem, BacklogFilter, BacklogSection } from '../types/domain/backlog'
import type { BacklogStorage } from '../types/storage'
import { READING_PLAN_STORAGE_KEYS } from '../types/storage'

function defaultBacklogStorage(): BacklogStorage {
  return {
    items: [],
    filter: {},
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * バックログを管理するcomposable
 *
 * ストレージの読み書きと、ランク・区分（section）・フィルター条件の更新を行う。
 * 表示リスト（未読＋BacklogFilter＋rank順）は呼び出し側で useStories と組み合わせて計算する。
 *
 * @param storageService ストレージサービス（デフォルトはLocalStorageService）
 * @returns バックログ管理の関数群
 */
export function useBacklog(storageService: IStorageService = new LocalStorageService()) {
  const storage = useLocalStorage(storageService)

  const items = ref<BacklogItem[]>([])
  const filter = ref<BacklogFilter>({})

  /** 同一 storyId の二重追加・並行更新を防ぐ（useBacklog インスタンス内に閉じる） */
  const processingStoryIds = new Set<string>()

  function withSectionLock(storyId: string, fn: () => void): void {
    if (processingStoryIds.has(storyId)) return
    processingStoryIds.add(storyId)
    try {
      fn()
    } finally {
      processingStoryIds.delete(storyId)
    }
  }

  function saveBacklog(): void {
    const data: BacklogStorage = {
      items: items.value,
      filter: filter.value,
      lastUpdated: new Date().toISOString(),
    }
    storage.set(READING_PLAN_STORAGE_KEYS.backlog, data)
  }

  /**
   * ストレージからバックログを読み込む
   */
  function loadBacklog(): void {
    const stored = storage.get<BacklogStorage>(READING_PLAN_STORAGE_KEYS.backlog)
    if (stored) {
      items.value = stored.items ?? []
      filter.value = stored.filter ?? {}
    } else {
      items.value = defaultBacklogStorage().items
      filter.value = defaultBacklogStorage().filter
    }
  }

  /**
   * フィルター条件を部分更新し、保存する
   */
  function setFilter(newFilter: Partial<BacklogFilter>): void {
    filter.value = { ...filter.value, ...newFilter }
    saveBacklog()
  }

  /**
   * フィルター条件をクリアし、保存する
   */
  function clearFilter(): void {
    filter.value = {}
    saveBacklog()
  }

  /**
   * 指定した並び順でランクを振り直す。
   * orderedStoryIds に含まれるアイテムは 0, 1, 2, ... のランクになる。
   * 含まれない既存アイテムはその後に続くランクを付与する。
   */
  function setRanks(orderedStoryIds: string[]): void {
    const rankMap = new Map<string, number>()
    orderedStoryIds.forEach((id, i) => rankMap.set(id, i))
    let nextRank = orderedStoryIds.length
    const newItems = items.value.map(item => {
      const r = rankMap.get(item.storyId)
      const rank = r !== undefined ? r : nextRank++
      return { ...item, rank }
    })
    items.value = newItems
    saveBacklog()
  }

  /**
   * 指定した rank 以下をスプリントバックログの候補に、それより後（かつ範囲外でない）をプロダクトバックログに更新する。
   * section が outOfScope のアイテムは変更しない。
   */
  function setInSprintBacklogUpToRank(upToRank: number): void {
    items.value = items.value.map(item => {
      if (item.section === 'outOfScope') return item
      const section: BacklogSection = item.rank <= upToRank ? 'sprintBacklog' : 'productBacklog'
      return { ...item, section }
    })
    saveBacklog()
  }

  /**
   * 指定ストーリーをプロダクトバックログの範囲外（計画外）に移す。「計画から外す」操作。
   */
  function moveToOutOfScope(storyId: string): void {
    withSectionLock(storyId, () => {
      const idx = items.value.findIndex(i => i.storyId === storyId)
      if (idx < 0) return
      items.value = items.value.map((item, i) =>
        i === idx ? { ...item, section: 'outOfScope' as const } : item
      )
      saveBacklog()
    })
  }

  /**
   * 指定ストーリーをプロダクトバックログに移す。
   * items に存在しない場合は BacklogItem を追加し、rank を末尾に付与する（moveToSprintBacklog と対称）。
   */
  function moveToProductBacklog(storyId: string): void {
    withSectionLock(storyId, () => {
      const idx = items.value.findIndex(i => i.storyId === storyId)
      if (idx >= 0) {
        items.value = items.value.map((item, i) =>
          i === idx ? { ...item, section: 'productBacklog' as const } : item
        )
      } else {
        const maxRank = items.value.length === 0 ? 0 : Math.max(...items.value.map(i => i.rank)) + 1
        items.value = [
          ...items.value,
          { storyId, rank: maxRank, section: 'productBacklog' as const },
        ]
      }
      saveBacklog()
    })
  }

  /**
   * 指定ストーリーをスプリントバックログの候補に移す。
   * items に存在しない場合は BacklogItem を追加し、rank を末尾に付与する。
   */
  function moveToSprintBacklog(storyId: string): void {
    withSectionLock(storyId, () => {
      const idx = items.value.findIndex(i => i.storyId === storyId)
      if (idx >= 0) {
        items.value = items.value.map((item, i) =>
          i === idx ? { ...item, section: 'sprintBacklog' as const } : item
        )
      } else {
        const maxRank = items.value.length === 0 ? 0 : Math.max(...items.value.map(i => i.rank)) + 1
        items.value = [
          ...items.value,
          { storyId, rank: maxRank, section: 'sprintBacklog' as const },
        ]
      }
      saveBacklog()
    })
  }

  loadBacklog()

  return {
    items,
    filter,
    loadBacklog,
    saveBacklog,
    setFilter,
    clearFilter,
    setRanks,
    setInSprintBacklogUpToRank,
    moveToOutOfScope,
    moveToProductBacklog,
    moveToSprintBacklog,
  }
}
