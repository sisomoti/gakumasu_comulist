import { ref } from 'vue'
import { LocalStorageService } from '../services/storage/LocalStorageService'
import type { IStorageService } from '../services/interfaces/IStorageService'
import { useLocalStorage } from './useLocalStorage'

/**
 * カード所持状態管理のキー
 */
const STORAGE_KEY = 'cardOwnership'

/**
 * カードの所持状態を管理するcomposable
 *
 * ストーリーの読了状態（useReadStatus）と同様のパターンで実装。
 * ローカルストレージに`cardOwnership: Record<string, boolean>`として保存される。
 * useReadStatus と一貫性のある実装パターンを採用している。
 *
 * @param storageService ストレージサービス（デフォルトはLocalStorageService）
 * @returns カード所持状態を管理する関数群
 */
export function useCardOwnership(storageService: IStorageService = new LocalStorageService()) {
  /**
   * カード所持状態のマップ
   * cardId -> owned (true = 所持, false = 未所持)
   */
  const cardOwnership = ref<Record<string, boolean>>({})

  /**
   * ローカルストレージ管理のcomposable
   */
  const storage = useLocalStorage(storageService)

  /**
   * ローカルストレージから所持状態を読み込む
   */
  function loadOwnership(): void {
    const stored = storage.get<Record<string, boolean>>(STORAGE_KEY)
    cardOwnership.value = stored ?? {}
  }

  /**
   * ローカルストレージに所持状態を保存する
   */
  function saveOwnership(): void {
    storage.set(STORAGE_KEY, cardOwnership.value)
  }

  /**
   * カードの所持状態を取得する
   * @param cardId カードID
   * @returns 所持している場合はtrue、未所持の場合はfalse
   */
  function isOwned(cardId: string): boolean {
    return cardOwnership.value[cardId] === true
  }

  /**
   * カードの所持状態を切り替える
   * @param cardId カードID
   */
  function toggleOwned(cardId: string): void {
    const current = isOwned(cardId)
    setOwned(cardId, !current)
  }

  /**
   * カードの所持状態を設定する
   * @param cardId カードID
   * @param owned 所持状態（true = 所持, false = 未所持）
   */
  function setOwned(cardId: string, owned: boolean): void {
    if (owned) {
      cardOwnership.value[cardId] = true
    } else {
      // falseの場合はキーを削除してストレージを節約
      delete cardOwnership.value[cardId]
    }
    saveOwnership()
  }

  /**
   * 所持しているカードIDのリストを取得する
   * @returns 所持しているカードIDの配列
   */
  function getAllOwnedCards(): string[] {
    return Object.keys(cardOwnership.value).filter(cardId => cardOwnership.value[cardId] === true)
  }

  // 初期化時にローカルストレージから読み込む
  loadOwnership()

  return {
    isOwned,
    toggleOwned,
    setOwned,
    getAllOwnedCards,
    loadOwnership,
  }
}
