import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCardOwnership } from '../../composables/useCardOwnership'
import type { IStorageService } from '../../services/interfaces/IStorageService'

describe('useCardOwnership', () => {
  let mockStorageService: IStorageService
  const STORAGE_KEY = 'cardOwnership'

  beforeEach(() => {
    // モックストレージサービスを作成
    mockStorageService = {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn()
    }
  })

  describe('isOwned', () => {
    it('所持していないカードの場合はfalseを返す', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { isOwned } = useCardOwnership(mockStorageService)

      expect(isOwned('card-1')).toBe(false)
    })

    it('所持しているカードの場合はtrueを返す', () => {
      const storedData = JSON.stringify({ 'card-1': true })
      vi.mocked(mockStorageService.get).mockReturnValue(storedData)
      const { isOwned } = useCardOwnership(mockStorageService)

      expect(isOwned('card-1')).toBe(true)
    })

    it('存在しないカードIDの場合はfalseを返す', () => {
      const storedData = JSON.stringify({ 'card-1': true })
      vi.mocked(mockStorageService.get).mockReturnValue(storedData)
      const { isOwned } = useCardOwnership(mockStorageService)

      expect(isOwned('card-2')).toBe(false)
    })
  })

  describe('setOwned', () => {
    it('カードを所持状態に設定できる', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { setOwned, isOwned } = useCardOwnership(mockStorageService)

      setOwned('card-1', true)

      expect(isOwned('card-1')).toBe(true)
      expect(mockStorageService.set).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify({ 'card-1': true })
      )
    })

    it('カードを未所持状態に設定できる（キーを削除）', () => {
      const storedData = JSON.stringify({ 'card-1': true, 'card-2': true })
      vi.mocked(mockStorageService.get).mockReturnValue(storedData)
      const { setOwned, isOwned } = useCardOwnership(mockStorageService)

      setOwned('card-1', false)

      expect(isOwned('card-1')).toBe(false)
      expect(isOwned('card-2')).toBe(true) // 他のカードは影響を受けない
      expect(mockStorageService.set).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify({ 'card-2': true })
      )
    })

    it('複数のカードの所持状態を設定できる', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { setOwned, isOwned } = useCardOwnership(mockStorageService)

      setOwned('card-1', true)
      setOwned('card-2', true)

      expect(isOwned('card-1')).toBe(true)
      expect(isOwned('card-2')).toBe(true)
    })

    it('保存に失敗した場合、エラーを投げる', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const error = new Error('Storage error')
      vi.mocked(mockStorageService.set).mockImplementation(() => {
        throw error
      })
      const { setOwned } = useCardOwnership(mockStorageService)

      expect(() => setOwned('card-1', true)).toThrow(error)
    })
  })

  describe('toggleOwned', () => {
    it('未所持のカードを所持状態に切り替えられる', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { toggleOwned, isOwned } = useCardOwnership(mockStorageService)

      toggleOwned('card-1')

      expect(isOwned('card-1')).toBe(true)
    })

    it('所持しているカードを未所持状態に切り替えられる', () => {
      const storedData = JSON.stringify({ 'card-1': true })
      vi.mocked(mockStorageService.get).mockReturnValue(storedData)
      const { toggleOwned, isOwned } = useCardOwnership(mockStorageService)

      toggleOwned('card-1')

      expect(isOwned('card-1')).toBe(false)
    })
  })

  describe('getAllOwnedCards', () => {
    it('所持しているカードIDのリストを取得できる', () => {
      const storedData = JSON.stringify({
        'card-1': true,
        'card-2': true,
        'card-3': false
      })
      vi.mocked(mockStorageService.get).mockReturnValue(storedData)
      const { getAllOwnedCards } = useCardOwnership(mockStorageService)

      const ownedCards = getAllOwnedCards()

      expect(ownedCards).toHaveLength(2)
      expect(ownedCards).toContain('card-1')
      expect(ownedCards).toContain('card-2')
      expect(ownedCards).not.toContain('card-3')
    })

    it('所持しているカードがない場合は空配列を返す', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { getAllOwnedCards } = useCardOwnership(mockStorageService)

      const ownedCards = getAllOwnedCards()

      expect(ownedCards).toHaveLength(0)
    })
  })

  describe('loadOwnership', () => {
    it('ローカルストレージから所持状態を読み込める', () => {
      const storedData = JSON.stringify({ 'card-1': true, 'card-2': true })
      vi.mocked(mockStorageService.get).mockReturnValue(storedData)
      const { isOwned, loadOwnership } = useCardOwnership(mockStorageService)

      // 初期化時に読み込まれていることを確認
      expect(isOwned('card-1')).toBe(true)
      expect(isOwned('card-2')).toBe(true)

      // 再度読み込む
      loadOwnership()
      expect(isOwned('card-1')).toBe(true)
    })

    it('ローカルストレージが空の場合は空のオブジェクトを使用', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { isOwned } = useCardOwnership(mockStorageService)

      expect(isOwned('card-1')).toBe(false)
    })

    it('無効なJSONの場合は空のオブジェクトを使用', () => {
      vi.mocked(mockStorageService.get).mockReturnValue('invalid json')
      const { isOwned } = useCardOwnership(mockStorageService)

      expect(isOwned('card-1')).toBe(false)
    })
  })

  describe('ProduceCardとSupportCardの両方に対応', () => {
    it('ProduceCardのIDで所持状態を管理できる', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { setOwned, isOwned } = useCardOwnership(mockStorageService)

      setOwned('produce-card-1', true)

      expect(isOwned('produce-card-1')).toBe(true)
    })

    it('SupportCardのIDで所持状態を管理できる', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { setOwned, isOwned } = useCardOwnership(mockStorageService)

      setOwned('support-card-1', true)

      expect(isOwned('support-card-1')).toBe(true)
    })

    it('ProduceCardとSupportCardを同じcardOwnershipオブジェクトで管理できる', () => {
      vi.mocked(mockStorageService.get).mockReturnValue(null)
      const { setOwned, isOwned, getAllOwnedCards } = useCardOwnership(mockStorageService)

      setOwned('produce-card-1', true)
      setOwned('support-card-1', true)

      expect(isOwned('produce-card-1')).toBe(true)
      expect(isOwned('support-card-1')).toBe(true)
      expect(getAllOwnedCards()).toHaveLength(2)
    })
  })
})
