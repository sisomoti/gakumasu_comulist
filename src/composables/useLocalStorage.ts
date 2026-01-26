import type { IStorageService } from '../services/interfaces/IStorageService'
import { LocalStorageService } from '../services/storage/LocalStorageService'

/**
 * 汎用的なローカルストレージ管理のためのcomposable
 *
 * 既存の`useReadStatus`や`useCardOwnership`が特定のキーに特化しているのに対し、
 * 任意のキーでデータを保存・読み込みできる汎用的なラッパーを提供する。
 *
 * @param storageService ストレージサービス（デフォルトはLocalStorageService）
 * @returns ローカルストレージを操作する関数群
 */
export function useLocalStorage(storageService: IStorageService = new LocalStorageService()) {
  /**
   * キーでデータを取得する
   * @param key 取得するキー
   * @returns キーに対応するデータ。存在しない場合はnull
   */
  function get<T>(key: string): T | null {
    try {
      const stored = storageService.get(key)
      if (!stored) {
        return null
      }
      return JSON.parse(stored) as T
    } catch {
      // パースエラーの場合はnullを返す
      return null
    }
  }

  /**
   * キーとデータを保存する
   * @param key 保存するキー
   * @param value 保存するデータ
   * @throws {Error} ストレージへの書き込みに失敗した場合
   */
  function set<T>(key: string, value: T): void {
    try {
      storageService.set(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Failed to save to localStorage with key "${key}":`, error)
      throw error
    }
  }

  /**
   * キーを削除する
   * @param key 削除するキー
   * @throws {Error} 削除に失敗した場合
   */
  function remove(key: string): void {
    try {
      storageService.remove(key)
    } catch (error) {
      console.error(`Failed to remove from localStorage with key "${key}":`, error)
      throw error
    }
  }

  /**
   * すべてのキーを削除する
   * @throws {Error} 削除に失敗した場合
   */
  function clear(): void {
    try {
      storageService.clear()
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
      throw error
    }
  }

  /**
   * キーの存在確認
   * @param key 確認するキー
   * @returns キーが存在する場合はtrue、存在しない場合はfalse
   */
  function has(key: string): boolean {
    const stored = storageService.get(key)
    return stored !== null && stored !== ''
  }

  return {
    get,
    set,
    remove,
    clear,
    has,
  }
}
