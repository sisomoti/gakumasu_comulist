/**
 * ストレージサービスのインターフェース
 * 
 * ローカルストレージなどのストレージ操作を抽象化するためのインターフェース。
 * SOLID原則のDependency Inversion Principle (DIP) に準拠。
 */
export interface IStorageService {
  /**
   * 指定されたキーの値を取得する
   * @param key 取得するキー
   * @returns キーに対応する値。存在しない場合はnullを返す
   */
  get(key: string): string | null

  /**
   * 指定されたキーに値を設定する
   * @param key 設定するキー
   * @param value 設定する値
   * @throws {Error} ストレージへの書き込みに失敗した場合
   */
  set(key: string, value: string): void

  /**
   * 指定されたキーの値を削除する
   * @param key 削除するキー
   */
  remove(key: string): void

  /**
   * ストレージ内のすべてのキーと値を削除する
   */
  clear(): void
}