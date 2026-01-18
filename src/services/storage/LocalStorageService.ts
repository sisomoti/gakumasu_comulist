import type { IStorageService } from '../interfaces/IStorageService'

/**
 * ローカルストレージサービスの実装
 * 
 * ブラウザのlocalStorage APIをラップして、型安全性とエラーハンドリングを提供する。
 * SOLID原則のSingle Responsibility Principle (SRP) に準拠。
 * IStorageServiceインターフェースを実装して、Liskov Substitution Principle (LSP) に準拠。
 */
export class LocalStorageService implements IStorageService {
  private readonly storage: Storage | null

  /**
   * LocalStorageServiceのコンストラクタ
   * @param storage 使用するストレージオブジェクト。デフォルトはwindow.localStorage
   */
  constructor(storage: Storage | null = typeof window !== 'undefined' ? window.localStorage : null) {
    this.storage = storage
  }

  /**
   * 指定されたキーの値を取得する
   * @param key 取得するキー
   * @returns キーに対応する値。存在しない場合、またはエラーが発生した場合はnullを返す
   */
  get(key: string): string | null {
    if (this.storage === null) {
      return null
    }

    try {
      return this.storage.getItem(key)
    } catch {
      // localStorageにアクセスできない場合（プライベートモードなど）はnullを返す
      return null
    }
  }

  /**
   * 指定されたキーに値を設定する
   * @param key 設定するキー
   * @param value 設定する値
   * @throws {Error} ストレージへの書き込みに失敗した場合（QuotaExceededError等）
   */
  set(key: string, value: string): void {
    if (this.storage === null) {
      throw new Error('localStorage is not available')
    }

    try {
      this.storage.setItem(key, value)
    } catch (error) {
      // エラーをそのまま再スロー（QuotaExceededErrorなど）
      throw error
    }
  }

  /**
   * 指定されたキーの値を削除する
   * @param key 削除するキー
   * @throws {Error} localStorageが利用できない場合
   */
  remove(key: string): void {
    if (this.storage === null) {
      throw new Error('localStorage is not available')
    }

    try {
      this.storage.removeItem(key)
    } catch {
      // removeItemのエラーは通常無視されるが、localStorageが利用できない場合は既にチェック済み
    }
  }

  /**
   * ストレージ内のすべてのキーと値を削除する
   * @throws {Error} localStorageが利用できない場合
   */
  clear(): void {
    if (this.storage === null) {
      throw new Error('localStorage is not available')
    }

    try {
      this.storage.clear()
    } catch {
      // clearのエラーは通常無視されるが、localStorageが利用できない場合は既にチェック済み
    }
  }
}