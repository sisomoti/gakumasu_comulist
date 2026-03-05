import { ref, computed } from 'vue'
import { LocalStorageService } from '../services/storage/LocalStorageService'
import type { IStorageService } from '../services/interfaces/IStorageService'
import { useLocalStorage } from './useLocalStorage'
import type { KanbanItem, KanbanBucket } from '../types/domain/sprint'
import type { KanbanStorage, KanbanColumnVisibility } from '../types/storage'
import { READING_PLAN_STORAGE_KEYS } from '../types/storage'
import type { BacklogItem } from '../types/domain/backlog'

/** useKanban のオプション（既読列移動時の読了同期用） */
export interface UseKanbanOptions {
  /** 既読列へ移動したときに呼ぶコールバック（useReadStatus.setRead(storyId, true) を渡す） */
  onMarkRead?: (storyId: string) => void
}

function defaultKanbanStorage(): KanbanStorage {
  return {
    items: [],
    sprintId: '',
    lastUpdated: new Date().toISOString(),
    columnVisibility: {
      unread: true,
      inProgress: true,
      read: true,
    },
  }
}

/**
 * カンバンを管理するcomposable
 *
 * 取得・保存、列間移動、バックログからの配分（sprintBacklog のみ未読列に追加）、
 * 列表示ON/OFF、進捗計算を提供する。フィルター条件は持たず、強調表示は View 側で行う。
 *
 * @param storageService ストレージサービス（デフォルトはLocalStorageService）
 * @param options onMarkRead: 既読列へ移動時に呼ぶコールバック
 * @returns カンバン管理の関数群
 */
export function useKanban(
  storageService: IStorageService = new LocalStorageService(),
  options: UseKanbanOptions = {}
) {
  const { onMarkRead } = options
  const storage = useLocalStorage(storageService)

  const items = ref<KanbanItem[]>([])
  const sprintId = ref<string>('')
  const columnVisibility = ref<KanbanColumnVisibility>({
    unread: true,
    inProgress: true,
    read: true,
  })

  function saveKanban(): void {
    const data: KanbanStorage = {
      items: items.value,
      sprintId: sprintId.value,
      lastUpdated: new Date().toISOString(),
      columnVisibility: columnVisibility.value,
    }
    storage.set(READING_PLAN_STORAGE_KEYS.kanban, data)
  }

  /**
   * ストレージからカンバンを読み込む
   */
  function loadKanban(): void {
    const stored = storage.get<KanbanStorage>(READING_PLAN_STORAGE_KEYS.kanban)
    if (stored) {
      items.value = stored.items ?? []
      sprintId.value = stored.sprintId ?? ''
      columnVisibility.value = stored.columnVisibility ?? defaultKanbanStorage().columnVisibility
    } else {
      const def = defaultKanbanStorage()
      items.value = def.items
      sprintId.value = def.sprintId
      columnVisibility.value = def.columnVisibility
    }
  }

  /**
   * 指定ストーリーを指定列に移動する。
   * 既読列（read）に移動した場合は onMarkRead が渡されていれば呼ぶ。
   */
  function moveItem(storyId: string, bucket: KanbanBucket): void {
    const idx = items.value.findIndex(i => i.storyId === storyId)
    if (idx < 0) return

    const current = items.value[idx]
    if (current.bucket === bucket) return

    const maxOrderInTarget =
      items.value.filter(i => i.bucket === bucket).reduce((max, i) => Math.max(max, i.order), -1) +
      1

    items.value = items.value.map((item, i) =>
      i === idx ? { ...item, bucket, order: maxOrderInTarget } : item
    )

    if (bucket === 'read') {
      onMarkRead?.(storyId)
    }
    saveKanban()
  }

  /**
   * 列内の順序を更新する（同一列内の order を振り直す）。
   * orderedStoryIds はその列に属する storyId の希望順。
   */
  function setOrderInBucket(bucket: KanbanBucket, orderedStoryIds: string[]): void {
    const inBucket = items.value.filter(i => i.bucket === bucket)
    if (inBucket.length === 0) return

    const orderMap = new Map<string, number>()
    orderedStoryIds.forEach((id, i) => orderMap.set(id, i))

    items.value = items.value.map(item => {
      if (item.bucket !== bucket) return item
      const order = orderMap.get(item.storyId)
      return order !== undefined ? { ...item, order } : item
    })
    saveKanban()
  }

  /**
   * バックログの sprintBacklog に属するストーリーを未読列に配分する。
   * 既にカンバンのいずれかの列に存在する storyId は追加しない。
   * 新規のみ未読列の末尾に追加。既存の進行中・既読のアイテムはそのまま維持する。
   */
  function distributeFromBacklog(backlogItems: BacklogItem[]): void {
    const sprintBacklogStoryIds = backlogItems
      .filter(b => b.section === 'sprintBacklog')
      .map(b => b.storyId)

    const existingStoryIds = new Set(items.value.map(i => i.storyId))
    const toAdd = sprintBacklogStoryIds.filter(id => !existingStoryIds.has(id))
    if (toAdd.length === 0) return

    const maxOrderUnread = items.value
      .filter(i => i.bucket === 'unread')
      .reduce((max, i) => Math.max(max, i.order), -1)

    const newItems: KanbanItem[] = toAdd.map((id, i) => ({
      storyId: id,
      bucket: 'unread' as const,
      order: maxOrderUnread + 1 + i,
    }))

    items.value = [...items.value, ...newItems]
    saveKanban()
  }

  /**
   * カンバンに紐づけるスプリントIDを設定する（スプリント開始時に View が呼ぶ想定）
   */
  function setSprintId(newSprintId: string): void {
    sprintId.value = newSprintId
    saveKanban()
  }

  /**
   * 列の表示ON/OFFを部分更新し、保存する
   */
  function setColumnVisibility(patch: Partial<KanbanColumnVisibility>): void {
    columnVisibility.value = { ...columnVisibility.value, ...patch }
    saveKanban()
  }

  /** 進捗（既読数 / 総数） */
  const progress = computed(() => {
    const total = items.value.length
    const read = items.value.filter(i => i.bucket === 'read').length
    return { read, total }
  })

  loadKanban()

  return {
    items,
    sprintId,
    columnVisibility,
    loadKanban,
    saveKanban,
    moveItem,
    setOrderInBucket,
    distributeFromBacklog,
    setSprintId,
    setColumnVisibility,
    progress,
  }
}
