import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LocalStorageService } from '../../services/storage/LocalStorageService'

describe('LocalStorageService', () => {
  let service: LocalStorageService
  let mockStorage: Storage

  beforeEach(() => {
    // モックストレージを作成
    mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    } as unknown as Storage

    service = new LocalStorageService(mockStorage)
  })

  describe('get', () => {
    it('存在するキーの値を取得できる', () => {
      const key = 'test-key'
      const value = 'test-value'
      vi.mocked(mockStorage.getItem).mockReturnValue(value)

      const result = service.get(key)

      expect(result).toBe(value)
      expect(mockStorage.getItem).toHaveBeenCalledWith(key)
    })

    it('存在しないキーの場合はnullを返す', () => {
      const key = 'non-existent-key'
      vi.mocked(mockStorage.getItem).mockReturnValue(null)

      const result = service.get(key)

      expect(result).toBeNull()
      expect(mockStorage.getItem).toHaveBeenCalledWith(key)
    })
  })

  describe('set', () => {
    it('キーと値を正しく設定できる', () => {
      const key = 'test-key'
      const value = 'test-value'

      service.set(key, value)

      expect(mockStorage.setItem).toHaveBeenCalledWith(key, value)
    })

    it('空文字列も設定できる', () => {
      const key = 'empty-key'
      const value = ''

      service.set(key, value)

      expect(mockStorage.setItem).toHaveBeenCalledWith(key, value)
    })

    it('QuotaExceededErrorが発生した場合、エラーを再スローする', () => {
      const key = 'test-key'
      const value = 'test-value'
      const quotaError = new DOMException('QuotaExceededError', 'QuotaExceededError')
      vi.mocked(mockStorage.setItem).mockImplementation(() => {
        throw quotaError
      })

      expect(() => service.set(key, value)).toThrow(quotaError)
    })

    it('その他のエラーが発生した場合、エラーを再スローする', () => {
      const key = 'test-key'
      const value = 'test-value'
      const error = new Error('Storage error')
      vi.mocked(mockStorage.setItem).mockImplementation(() => {
        throw error
      })

      expect(() => service.set(key, value)).toThrow(error)
    })
  })

  describe('remove', () => {
    it('指定されたキーを削除できる', () => {
      const key = 'test-key'

      service.remove(key)

      expect(mockStorage.removeItem).toHaveBeenCalledWith(key)
    })

    it('存在しないキーを削除してもエラーが発生しない', () => {
      const key = 'non-existent-key'
      vi.mocked(mockStorage.removeItem).mockImplementation(() => {
        // エラーを投げない
      })

      expect(() => service.remove(key)).not.toThrow()
      expect(mockStorage.removeItem).toHaveBeenCalledWith(key)
    })
  })

  describe('clear', () => {
    it('ストレージ内のすべてのデータを削除できる', () => {
      service.clear()

      expect(mockStorage.clear).toHaveBeenCalledOnce()
    })
  })

  describe('エラーハンドリング', () => {
    it('localStorageが利用できない場合、getでnullを返す', () => {
      const unavailableStorage = null
      const serviceWithNullStorage = new LocalStorageService(unavailableStorage)

      const result = serviceWithNullStorage.get('test-key')

      expect(result).toBeNull()
    })

    it('localStorageが利用できない場合、setでエラーを投げる', () => {
      const unavailableStorage = null
      const serviceWithNullStorage = new LocalStorageService(unavailableStorage)

      expect(() => serviceWithNullStorage.set('test-key', 'value')).toThrow(
        'localStorage is not available'
      )
    })

    it('localStorageが利用できない場合、removeでエラーを投げる', () => {
      const unavailableStorage = null
      const serviceWithNullStorage = new LocalStorageService(unavailableStorage)

      expect(() => serviceWithNullStorage.remove('test-key')).toThrow(
        'localStorage is not available'
      )
    })

    it('localStorageが利用できない場合、clearでエラーを投げる', () => {
      const unavailableStorage = null
      const serviceWithNullStorage = new LocalStorageService(unavailableStorage)

      expect(() => serviceWithNullStorage.clear()).toThrow(
        'localStorage is not available'
      )
    })

    it('getItemがエラーを投げた場合、nullを返す', () => {
      const errorStorage = {
        getItem: vi.fn().mockImplementation(() => {
          throw new Error('Access denied')
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn()
      } as unknown as Storage
      const serviceWithErrorStorage = new LocalStorageService(errorStorage)

      const result = serviceWithErrorStorage.get('test-key')

      expect(result).toBeNull()
    })
  })

  describe('IStorageServiceインターフェース準拠', () => {
    it('IStorageServiceインターフェースのすべてのメソッドを実装している', () => {
      expect(typeof service.get).toBe('function')
      expect(typeof service.set).toBe('function')
      expect(typeof service.remove).toBe('function')
      expect(typeof service.clear).toBe('function')
    })
  })
})