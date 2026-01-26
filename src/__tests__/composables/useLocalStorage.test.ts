import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useLocalStorage } from '../../composables/useLocalStorage'
import type { IStorageService } from '../../services/interfaces/IStorageService'

describe('useLocalStorage', () => {
  let mockStorageService: IStorageService

  beforeEach(() => {
    // モックストレージサービスを作成
    mockStorageService = {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }
  })

  describe('get', () => {
    it('存在するキーの値を取得できる', () => {
      const storedData = JSON.stringify({ name: 'test', value: 123 })
      vi.mocked(mockStorageService.get).mockReturnValue(storedData)
      const { get } = useLocalStorage(mockStorageService)

      const result = get<{ name: string; value: number }>('test-key')

      expect(result).toEqual({ name: 'test', value: 123 })
      expect(mockStorageService.get).toHaveBeenCalledWith('test-key')
    })

    it('存在しないキーの場合はnullを返す', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { get } = useLocalStorage(mockStorageService)

      const result = get('non-existent-key')

      expect(result).toBeNull()
    })

    it('無効なJSONの場合はnullを返す', () => {
      vi.mocked(mockStorageService.get).mockReturnValue('invalid json')
      const { get } = useLocalStorage(mockStorageService)

      const result = get('invalid-key')

      expect(result).toBeNull()
    })

    it('空文字列の場合はnullを返す', () => {
      vi.mocked(mockStorageService.get).mockReturnValue('')
      const { get } = useLocalStorage(mockStorageService)

      const result = get('empty-key')

      expect(result).toBeNull()
    })
  })

  describe('set', () => {
    it('値を保存できる', () => {
      const { set } = useLocalStorage(mockStorageService)
      const value = { name: 'test', value: 123 }

      set('test-key', value)

      expect(mockStorageService.set).toHaveBeenCalledWith('test-key', JSON.stringify(value))
    })

    it('文字列を保存できる', () => {
      const { set } = useLocalStorage(mockStorageService)

      set('test-key', 'string-value')

      expect(mockStorageService.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify('string-value')
      )
    })

    it('数値を保存できる', () => {
      const { set } = useLocalStorage(mockStorageService)

      set('test-key', 42)

      expect(mockStorageService.set).toHaveBeenCalledWith('test-key', JSON.stringify(42))
    })

    it('配列を保存できる', () => {
      const { set } = useLocalStorage(mockStorageService)
      const value = [1, 2, 3]

      set('test-key', value)

      expect(mockStorageService.set).toHaveBeenCalledWith('test-key', JSON.stringify(value))
    })

    it('保存に失敗した場合、エラーを投げる', () => {
      const error = new Error('Storage error')
      vi.mocked(mockStorageService.set).mockImplementation(() => {
        throw error
      })
      const { set } = useLocalStorage(mockStorageService)

      expect(() => set('test-key', 'value')).toThrow(error)
    })
  })

  describe('remove', () => {
    it('キーを削除できる', () => {
      const { remove } = useLocalStorage(mockStorageService)

      remove('test-key')

      expect(mockStorageService.remove).toHaveBeenCalledWith('test-key')
    })

    it('削除に失敗した場合、エラーを投げる', () => {
      const error = new Error('Remove error')
      vi.mocked(mockStorageService.remove).mockImplementation(() => {
        throw error
      })
      const { remove } = useLocalStorage(mockStorageService)

      expect(() => remove('test-key')).toThrow(error)
    })
  })

  describe('clear', () => {
    it('すべてのキーを削除できる', () => {
      const { clear } = useLocalStorage(mockStorageService)

      clear()

      expect(mockStorageService.clear).toHaveBeenCalled()
    })

    it('削除に失敗した場合、エラーを投げる', () => {
      const error = new Error('Clear error')
      vi.mocked(mockStorageService.clear).mockImplementation(() => {
        throw error
      })
      const { clear } = useLocalStorage(mockStorageService)

      expect(() => clear()).toThrow(error)
    })
  })

  describe('has', () => {
    it('存在するキーの場合はtrueを返す', () => {
      vi.mocked(mockStorageService.get).mockReturnValue('some-value')
      const { has } = useLocalStorage(mockStorageService)

      const result = has('test-key')

      expect(result).toBe(true)
      expect(mockStorageService.get).toHaveBeenCalledWith('test-key')
    })

    it('存在しないキーの場合はfalseを返す', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { has } = useLocalStorage(mockStorageService)

      const result = has('non-existent-key')

      expect(result).toBe(false)
    })

    it('空文字列の場合はfalseを返す', () => {
      vi.mocked(mockStorageService.get).mockReturnValue('')
      const { has } = useLocalStorage(mockStorageService)

      const result = has('empty-key')

      expect(result).toBe(false)
    })
  })
})
