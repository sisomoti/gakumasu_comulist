import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useReadStatus } from '../../composables/useReadStatus'
import { useCardOwnership } from '../../composables/useCardOwnership'
import { LocalStorageService } from '../../services/storage/LocalStorageService'

/**
 * 結合テスト: ストレージ統合
 *
 * useReadStatus/useCardOwnership → LocalStorageService の連携をテストする
 */
describe('統合テスト: ストレージ', () => {
  let storageService: LocalStorageService
  let readStatus: ReturnType<typeof useReadStatus>
  let cardOwnership: ReturnType<typeof useCardOwnership>

  beforeEach(() => {
    // 各テスト前にストレージをクリア
    storageService = new LocalStorageService()
    storageService.clear()

    // Composablesを初期化
    readStatus = useReadStatus(storageService)
    cardOwnership = useCardOwnership(storageService)
  })

  afterEach(() => {
    // 各テスト後にストレージをクリア
    storageService.clear()
  })

  describe('useReadStatus → LocalStorageService', () => {
    it('読了状態を設定するとローカルストレージに保存される', () => {
      const storyId = 'test-story-1'

      // 初期状態では未読
      expect(readStatus.isRead(storyId)).toBe(false)

      // 読了状態を設定
      readStatus.setRead(storyId, true)

      // メモリ上で読了状態になっていることを確認
      expect(readStatus.isRead(storyId)).toBe(true)

      // ローカルストレージに保存されていることを確認
      const stored = storageService.get('readStatus')
      expect(stored).not.toBeNull()
      if (stored) {
        const parsed = JSON.parse(stored)
        expect(parsed[storyId]).toBe(true)
      }
    })

    it('読了状態を解除するとローカルストレージから削除される', () => {
      const storyId = 'test-story-1'

      // 読了状態を設定
      readStatus.setRead(storyId, true)
      expect(readStatus.isRead(storyId)).toBe(true)

      // 未読状態に戻す
      readStatus.setRead(storyId, false)

      // メモリ上で未読状態になっていることを確認
      expect(readStatus.isRead(storyId)).toBe(false)

      // ローカルストレージから削除されていることを確認
      const stored = storageService.get('readStatus')
      if (stored) {
        const parsed = JSON.parse(stored)
        expect(parsed[storyId]).toBeUndefined()
      }
    })

    it('toggleReadで読了状態を切り替えられる', () => {
      const storyId = 'test-story-1'

      // 初期状態では未読
      expect(readStatus.isRead(storyId)).toBe(false)

      // トグルで読了に
      readStatus.toggleRead(storyId)
      expect(readStatus.isRead(storyId)).toBe(true)

      // トグルで未読に戻る
      readStatus.toggleRead(storyId)
      expect(readStatus.isRead(storyId)).toBe(false)
    })

    it('複数のストーリーの読了状態を管理できる', () => {
      const storyIds = ['story-1', 'story-2', 'story-3']

      // すべて未読
      storyIds.forEach(id => {
        expect(readStatus.isRead(id)).toBe(false)
      })

      // 一部を読了
      readStatus.setRead('story-1', true)
      readStatus.setRead('story-2', true)

      expect(readStatus.isRead('story-1')).toBe(true)
      expect(readStatus.isRead('story-2')).toBe(true)
      expect(readStatus.isRead('story-3')).toBe(false)

      // getAllReadStoriesで読了済みを取得できる
      const readStories = readStatus.getAllReadStories()
      expect(readStories).toContain('story-1')
      expect(readStories).toContain('story-2')
      expect(readStories).not.toContain('story-3')
    })

    it('ローカルストレージから読了状態を読み込める', () => {
      const storyId = 'test-story-1'

      // 直接ローカルストレージに保存
      storageService.set('readStatus', JSON.stringify({ [storyId]: true }))

      // 新しいインスタンスを作成（loadReadStatusが呼ばれる）
      const newReadStatus = useReadStatus(storageService)

      // 読み込まれたことを確認
      expect(newReadStatus.isRead(storyId)).toBe(true)
    })
  })

  describe('useCardOwnership → LocalStorageService', () => {
    it('所持状態を設定するとローカルストレージに保存される', () => {
      const cardId = 'test-card-1'

      // 初期状態では未所持
      expect(cardOwnership.isOwned(cardId)).toBe(false)

      // 所持状態を設定
      cardOwnership.setOwned(cardId, true)

      // メモリ上で所持状態になっていることを確認
      expect(cardOwnership.isOwned(cardId)).toBe(true)

      // ローカルストレージに保存されていることを確認
      const stored = storageService.get('cardOwnership')
      expect(stored).not.toBeNull()
      if (stored) {
        const parsed = JSON.parse(stored)
        expect(parsed[cardId]).toBe(true)
      }
    })

    it('所持状態を解除するとローカルストレージから削除される', () => {
      const cardId = 'test-card-1'

      // 所持状態を設定
      cardOwnership.setOwned(cardId, true)
      expect(cardOwnership.isOwned(cardId)).toBe(true)

      // 未所持状態に戻す
      cardOwnership.setOwned(cardId, false)

      // メモリ上で未所持状態になっていることを確認
      expect(cardOwnership.isOwned(cardId)).toBe(false)

      // ローカルストレージから削除されていることを確認
      const stored = storageService.get('cardOwnership')
      if (stored) {
        const parsed = JSON.parse(stored)
        expect(parsed[cardId]).toBeUndefined()
      }
    })

    it('toggleOwnedで所持状態を切り替えられる', () => {
      const cardId = 'test-card-1'

      // 初期状態では未所持
      expect(cardOwnership.isOwned(cardId)).toBe(false)

      // トグルで所持に
      cardOwnership.toggleOwned(cardId)
      expect(cardOwnership.isOwned(cardId)).toBe(true)

      // トグルで未所持に戻る
      cardOwnership.toggleOwned(cardId)
      expect(cardOwnership.isOwned(cardId)).toBe(false)
    })

    it('複数のカードの所持状態を管理できる', () => {
      const cardIds = ['card-1', 'card-2', 'card-3']

      // すべて未所持
      cardIds.forEach(id => {
        expect(cardOwnership.isOwned(id)).toBe(false)
      })

      // 一部を所持
      cardOwnership.setOwned('card-1', true)
      cardOwnership.setOwned('card-2', true)

      expect(cardOwnership.isOwned('card-1')).toBe(true)
      expect(cardOwnership.isOwned('card-2')).toBe(true)
      expect(cardOwnership.isOwned('card-3')).toBe(false)

      // getAllOwnedCardsで所持カードを取得できる
      const ownedCards = cardOwnership.getAllOwnedCards()
      expect(ownedCards).toContain('card-1')
      expect(ownedCards).toContain('card-2')
      expect(ownedCards).not.toContain('card-3')
    })

    it('ローカルストレージから所持状態を読み込める', () => {
      const cardId = 'test-card-1'

      // 直接ローカルストレージに保存
      storageService.set('cardOwnership', JSON.stringify({ [cardId]: true }))

      // 新しいインスタンスを作成（loadOwnershipが呼ばれる）
      const newCardOwnership = useCardOwnership(storageService)

      // 読み込まれたことを確認
      expect(newCardOwnership.isOwned(cardId)).toBe(true)
    })
  })

  describe('useReadStatus と useCardOwnership の独立性', () => {
    it('読了状態と所持状態は独立して管理される', () => {
      const storyId = 'story-1'
      const cardId = 'card-1'

      // 読了状態を設定
      readStatus.setRead(storyId, true)

      // 所持状態を設定
      cardOwnership.setOwned(cardId, true)

      // それぞれが独立して管理されていることを確認
      expect(readStatus.isRead(storyId)).toBe(true)
      expect(cardOwnership.isOwned(cardId)).toBe(true)

      // ストレージキーが異なることを確認
      const readStatusData = storageService.get('readStatus')
      const cardOwnershipData = storageService.get('cardOwnership')

      expect(readStatusData).not.toBeNull()
      expect(cardOwnershipData).not.toBeNull()

      if (readStatusData && cardOwnershipData) {
        const readStatusParsed = JSON.parse(readStatusData)
        const cardOwnershipParsed = JSON.parse(cardOwnershipData)

        expect(readStatusParsed[storyId]).toBe(true)
        expect(cardOwnershipParsed[cardId]).toBe(true)
      }
    })
  })
})
