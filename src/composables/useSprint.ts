import { ref } from 'vue'
import { LocalStorageService } from '../services/storage/LocalStorageService'
import type { IStorageService } from '../services/interfaces/IStorageService'
import { useLocalStorage } from './useLocalStorage'
import type { Sprint, SprintPeriod } from '../types/domain/sprint'
import type { SprintStorage } from '../types/storage'
import { READING_PLAN_STORAGE_KEYS } from '../types/storage'

/** スプリント開始時のオプション */
export interface StartSprintOptions {
  /** 開始日（ISO 8601形式） */
  startDate: string
  /** 終了日（ISO 8601形式）。null の場合は無期限 */
  endDate: string | null
  /** 目標期間 */
  targetPeriod: SprintPeriod
  /** スプリントに含めるストーリーID（省略時は空配列） */
  storyIds?: string[]
}

/** スプリントの部分更新（modifySprint 用） */
export interface ModifySprintPatch {
  startDate?: string
  endDate?: string | null
  targetPeriod?: SprintPeriod
}

/**
 * スプリントを管理するcomposable
 *
 * 1つのアクティブなスプリントのみ管理。useReadStatus と同様のパターンで
 * ローカルストレージに保存する。
 *
 * @param storageService ストレージサービス（デフォルトはLocalStorageService）
 * @returns スプリント管理の関数群
 */
export function useSprint(storageService: IStorageService = new LocalStorageService()) {
  const activeSprint = ref<Sprint | null>(null)
  const storage = useLocalStorage(storageService)

  function saveSprint(): void {
    const data: SprintStorage = { activeSprint: activeSprint.value }
    storage.set(READING_PLAN_STORAGE_KEYS.sprint, data)
  }

  /**
   * ストレージからスプリントを読み込む
   */
  function loadSprint(): void {
    const stored = storage.get<SprintStorage>(READING_PLAN_STORAGE_KEYS.sprint)
    activeSprint.value = stored?.activeSprint ?? null
  }

  /**
   * 新規スプリントを開始する。既存のアクティブスプリントは上書きする。
   */
  function startSprint(options: StartSprintOptions): void {
    const storyIds = options.storyIds ?? []
    activeSprint.value = {
      id: crypto.randomUUID(),
      startDate: options.startDate,
      endDate: options.endDate,
      targetPeriod: options.targetPeriod,
      isActive: true,
      storyIds: [...storyIds],
    }
    saveSprint()
  }

  /**
   * 現在のアクティブスプリントを終了する（isActive を false にする）。
   */
  function endSprint(): void {
    if (activeSprint.value) {
      activeSprint.value = { ...activeSprint.value, isActive: false }
      saveSprint()
    }
  }

  /**
   * アクティブスプリントの開始日・終了日・目標期間を更新する。
   */
  function modifySprint(patch: ModifySprintPatch): void {
    if (!activeSprint.value) return
    activeSprint.value = {
      ...activeSprint.value,
      ...(patch.startDate !== undefined && { startDate: patch.startDate }),
      ...(patch.endDate !== undefined && { endDate: patch.endDate }),
      ...(patch.targetPeriod !== undefined && { targetPeriod: patch.targetPeriod }),
    }
    saveSprint()
  }

  /**
   * アクティブスプリントにストーリーを追加する（マージ）。既存の storyIds と重複する ID は追加しない。
   */
  function addStoriesToSprint(storyIds: string[]): void {
    if (!activeSprint.value) return
    const existing = new Set(activeSprint.value.storyIds)
    const toAdd = storyIds.filter(id => !existing.has(id))
    if (toAdd.length === 0) return
    activeSprint.value = {
      ...activeSprint.value,
      storyIds: [...activeSprint.value.storyIds, ...toAdd],
    }
    saveSprint()
  }

  loadSprint()

  return {
    activeSprint,
    startSprint,
    endSprint,
    modifySprint,
    addStoriesToSprint,
    loadSprint,
  }
}
