import { ref } from 'vue'
import { LocalStorageService } from '../services/storage/LocalStorageService'
import type { IStorageService } from '../services/interfaces/IStorageService'

/**
 * ストーリー読了状態管理のキー
 */
const STORAGE_KEY = 'readStatus'

/**
 * ストーリーの読了状態を管理するcomposable
 * 
 * カードの所持状態（useCardOwnership）と同様のパターンで実装。
 * ローカルストレージに`readStatus: Record<string, boolean>`として保存される。
 * 
 * @param storageService ストレージサービス（デフォルトはLocalStorageService）
 * @returns ストーリー読了状態を管理する関数群
 */
export function useReadStatus(
  storageService: IStorageService = new LocalStorageService()
) {
  /**
   * ストーリー読了状態のマップ
   * storyId -> read (true = 読了, false = 未読)
   */
  const readStatus = ref<Record<string, boolean>>({})

  /**
   * ローカルストレージから読了状態を読み込む
   */
  function loadReadStatus(): void {
    try {
      const stored = storageService.get(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, boolean>
        readStatus.value = parsed
      } else {
        readStatus.value = {}
      }
    } catch {
      // パースエラーの場合は空のオブジェクトを使用
      readStatus.value = {}
    }
  }

  /**
   * ローカルストレージに読了状態を保存する
   */
  function saveReadStatus(): void {
    try {
      storageService.set(STORAGE_KEY, JSON.stringify(readStatus.value))
    } catch (error) {
      console.error('Failed to save read status:', error)
      throw error
    }
  }

  /**
   * ストーリーの読了状態を取得する
   * @param storyId ストーリーID
   * @returns 読了している場合はtrue、未読の場合はfalse
   */
  function isRead(storyId: string): boolean {
    return readStatus.value[storyId] === true
  }

  /**
   * ストーリーの読了状態を切り替える
   * @param storyId ストーリーID
   */
  function toggleRead(storyId: string): void {
    const current = isRead(storyId)
    setRead(storyId, !current)
  }

  /**
   * ストーリーの読了状態を設定する
   * @param storyId ストーリーID
   * @param read 読了状態（true = 読了, false = 未読）
   */
  function setRead(storyId: string, read: boolean): void {
    if (read) {
      readStatus.value[storyId] = true
    } else {
      // falseの場合はキーを削除してストレージを節約
      delete readStatus.value[storyId]
    }
    saveReadStatus()
  }

  /**
   * 読了済みストーリーIDのリストを取得する
   * @returns 読了済みストーリーIDの配列
   */
  function getAllReadStories(): string[] {
    return Object.keys(readStatus.value).filter(
      storyId => readStatus.value[storyId] === true
    )
  }

  // 初期化時にローカルストレージから読み込む
  loadReadStatus()

  return {
    isRead,
    toggleRead,
    setRead,
    getAllReadStories,
    loadReadStatus
  }
}
