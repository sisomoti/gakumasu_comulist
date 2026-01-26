import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useReadStatus } from '../../composables/useReadStatus'
import type { IStorageService } from '../../services/interfaces/IStorageService'

describe('useReadStatus', () => {
  let mockStorageService: IStorageService
  const STORAGE_KEY = 'readStatus'

  beforeEach(() => {
    // モックストレージサービスを作成
    mockStorageService = {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn()
    }
  })

  describe('isRead', () => {
    it('未読のストーリーの場合はfalseを返す', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { isRead } = useReadStatus(mockStorageService)

      expect(isRead('story-1')).toBe(false)
    })

    it('読了しているストーリーの場合はtrueを返す', () => {
      const storedData = JSON.stringify({ 'story-1': true })
      vi.mocked(mockStorageService.get).mockReturnValue(storedData)
      const { isRead } = useReadStatus(mockStorageService)

      expect(isRead('story-1')).toBe(true)
    })

    it('存在しないストーリーIDの場合はfalseを返す', () => {
      const storedData = JSON.stringify({ 'story-1': true })
      vi.mocked(mockStorageService.get).mockReturnValue(storedData)
      const { isRead } = useReadStatus(mockStorageService)

      expect(isRead('story-2')).toBe(false)
    })
  })

  describe('setRead', () => {
    it('ストーリーを読了状態に設定できる', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { setRead, isRead } = useReadStatus(mockStorageService)

      setRead('story-1', true)

      expect(isRead('story-1')).toBe(true)
      expect(mockStorageService.set).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify({ 'story-1': true })
      )
    })

    it('ストーリーを未読状態に設定できる（キーを削除）', () => {
      const storedData = JSON.stringify({ 'story-1': true, 'story-2': true })
      vi.mocked(mockStorageService.get).mockReturnValue(storedData)
      const { setRead, isRead } = useReadStatus(mockStorageService)

      setRead('story-1', false)

      expect(isRead('story-1')).toBe(false)
      expect(isRead('story-2')).toBe(true) // 他のストーリーは影響を受けない
      expect(mockStorageService.set).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify({ 'story-2': true })
      )
    })

    it('複数のストーリーの読了状態を設定できる', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { setRead, isRead } = useReadStatus(mockStorageService)

      setRead('story-1', true)
      setRead('story-2', true)

      expect(isRead('story-1')).toBe(true)
      expect(isRead('story-2')).toBe(true)
    })

    it('保存に失敗した場合、エラーを投げる', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const error = new Error('Storage error')
      vi.mocked(mockStorageService.set).mockImplementation(() => {
        throw error
      })
      const { setRead } = useReadStatus(mockStorageService)

      expect(() => setRead('story-1', true)).toThrow(error)
    })
  })

  describe('toggleRead', () => {
    it('未読のストーリーを読了状態に切り替えられる', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { toggleRead, isRead } = useReadStatus(mockStorageService)

      toggleRead('story-1')

      expect(isRead('story-1')).toBe(true)
    })

    it('読了しているストーリーを未読状態に切り替えられる', () => {
      const storedData = JSON.stringify({ 'story-1': true })
      vi.mocked(mockStorageService.get).mockReturnValue(storedData)
      const { toggleRead, isRead } = useReadStatus(mockStorageService)

      toggleRead('story-1')

      expect(isRead('story-1')).toBe(false)
    })
  })

  describe('getAllReadStories', () => {
    it('読了済みストーリーIDのリストを取得できる', () => {
      const storedData = JSON.stringify({
        'story-1': true,
        'story-2': true,
        'story-3': false
      })
      vi.mocked(mockStorageService.get).mockReturnValue(storedData)
      const { getAllReadStories } = useReadStatus(mockStorageService)

      const readStories = getAllReadStories()

      expect(readStories).toHaveLength(2)
      expect(readStories).toContain('story-1')
      expect(readStories).toContain('story-2')
      expect(readStories).not.toContain('story-3')
    })

    it('読了済みストーリーがない場合は空配列を返す', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { getAllReadStories } = useReadStatus(mockStorageService)

      const readStories = getAllReadStories()

      expect(readStories).toHaveLength(0)
    })
  })

  describe('loadReadStatus', () => {
    it('ローカルストレージから読了状態を読み込める', () => {
      const storedData = JSON.stringify({ 'story-1': true, 'story-2': true })
      vi.mocked(mockStorageService.get).mockReturnValue(storedData)
      const { isRead, loadReadStatus } = useReadStatus(mockStorageService)

      // 初期化時に読み込まれていることを確認
      expect(isRead('story-1')).toBe(true)
      expect(isRead('story-2')).toBe(true)

      // 再度読み込む
      loadReadStatus()
      expect(isRead('story-1')).toBe(true)
    })

    it('ローカルストレージが空の場合は空のオブジェクトを使用', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { isRead } = useReadStatus(mockStorageService)

      expect(isRead('story-1')).toBe(false)
    })

    it('無効なJSONの場合は空のオブジェクトを使用', () => {
      vi.mocked(mockStorageService.get).mockReturnValue('invalid json')
      const { isRead } = useReadStatus(mockStorageService)

      expect(isRead('story-1')).toBe(false)
    })
  })

  describe('ProduceCardStoryとSupportCardStoryの両方に対応', () => {
    it('ProduceCardStoryのIDで読了状態を管理できる', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { setRead, isRead } = useReadStatus(mockStorageService)

      setRead('produce-card-story-1', true)

      expect(isRead('produce-card-story-1')).toBe(true)
    })

    it('SupportCardStoryのIDで読了状態を管理できる', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { setRead, isRead } = useReadStatus(mockStorageService)

      setRead('support-card-story-1', true)

      expect(isRead('support-card-story-1')).toBe(true)
    })

    it('ProduceCardStoryとSupportCardStoryを同じreadStatusオブジェクトで管理できる', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { setRead, isRead, getAllReadStories } = useReadStatus(mockStorageService)

      setRead('produce-card-story-1', true)
      setRead('support-card-story-1', true)

      expect(isRead('produce-card-story-1')).toBe(true)
      expect(isRead('support-card-story-1')).toBe(true)
      expect(getAllReadStories()).toHaveLength(2)
    })
  })
})
