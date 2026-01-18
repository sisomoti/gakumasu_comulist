import { describe, it, expect } from 'vitest'
import {
  validateProduceCard,
  validateSupportCard,
  validateAllCards
} from '../../../utils/domain/cardValidator'
import type {
  Idol,
  ProduceCard,
  SupportCard,
  ProduceCardStory,
  SupportCardStory
} from '../../../types/domain'

describe('cardValidator', () => {
  const mockIdols: Idol[] = [
    { id: 'idol-1', name: 'アイドル1' },
    { id: 'idol-2', name: 'アイドル2' },
    { id: 'idol-3', name: 'アイドル3' }
  ]

  describe('validateProduceCard', () => {
    it('正常なProduceCard（SSR、3話）の場合は検証が成功する', () => {
      const card: ProduceCard = {
        id: 'produce-1',
        name: 'テストプロデュースカード',
        rarity: 'SSR',
        idolId: 'idol-1'
      }

      const stories: ProduceCardStory[] = [
        { id: 'story-1', produceCardId: 'produce-1', storyIndex: 1 },
        { id: 'story-2', produceCardId: 'produce-1', storyIndex: 2 },
        { id: 'story-3', produceCardId: 'produce-1', storyIndex: 3 }
      ]

      const result = validateProduceCard(card, mockIdols, stories)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('正常なProduceCard（SR、0話）の場合は検証が成功する', () => {
      const card: ProduceCard = {
        id: 'produce-2',
        name: 'テストプロデュースカード',
        rarity: 'SR',
        idolId: 'idol-1'
      }

      const stories: ProduceCardStory[] = []

      const result = validateProduceCard(card, mockIdols, stories)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('存在しないIdolを参照している場合は検証が失敗する', () => {
      const card: ProduceCard = {
        id: 'produce-1',
        name: 'テストプロデュースカード',
        rarity: 'SSR',
        idolId: 'non-existent-idol'
      }

      const stories: ProduceCardStory[] = []

      const result = validateProduceCard(card, mockIdols, stories)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'ProduceCard "produce-1" のidolId "non-existent-idol" が存在するIdolを参照していません'
      )
    })

    it('ストーリー数が期待値と異なる場合は検証が失敗する（SSRで3話以外）', () => {
      const card: ProduceCard = {
        id: 'produce-1',
        name: 'テストプロデュースカード',
        rarity: 'SSR',
        idolId: 'idol-1'
      }

      const stories: ProduceCardStory[] = [
        { id: 'story-1', produceCardId: 'produce-1', storyIndex: 1 }
        // 2話と3話が欠けている
      ]

      const result = validateProduceCard(card, mockIdols, stories)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'ProduceCard "produce-1" のストーリー数が不正です。期待値: 3、実際: 1'
      )
    })

    it('ストーリー数が期待値と異なる場合は検証が失敗する（SRで0話以外）', () => {
      const card: ProduceCard = {
        id: 'produce-2',
        name: 'テストプロデュースカード',
        rarity: 'SR',
        idolId: 'idol-1'
      }

      const stories: ProduceCardStory[] = [
        { id: 'story-1', produceCardId: 'produce-2', storyIndex: 1 }
        // SRは0話であるべき
      ]

      const result = validateProduceCard(card, mockIdols, stories)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'ProduceCard "produce-2" のストーリー数が不正です。期待値: 0、実際: 1'
      )
    })

    it('ストーリーインデックスが不正な場合は検証が失敗する', () => {
      const card: ProduceCard = {
        id: 'produce-1',
        name: 'テストプロデュースカード',
        rarity: 'SSR',
        idolId: 'idol-1'
      }

      const stories: ProduceCardStory[] = [
        { id: 'story-1', produceCardId: 'produce-1', storyIndex: 1 },
        { id: 'story-2', produceCardId: 'produce-1', storyIndex: 2 },
        { id: 'story-3', produceCardId: 'produce-1', storyIndex: 4 } // 4は不正
      ]

      const result = validateProduceCard(card, mockIdols, stories)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'ProduceCard "produce-1" のストーリーインデックスが不正です。期待値: [1, 2, 3]、実際: [1, 2, 4]'
      )
    })
  })

  describe('validateSupportCard', () => {
    it('正常なSupportCard（SSR、3話）の場合は検証が成功する', () => {
      const card: SupportCard = {
        id: 'support-1',
        name: 'テストサポートカード',
        rarity: 'SSR',
        mainIdolId: 'idol-1',
        appearingIdolIds: ['idol-2']
      }

      const stories: SupportCardStory[] = [
        { id: 'story-1', supportCardId: 'support-1', storyIndex: 1 },
        { id: 'story-2', supportCardId: 'support-1', storyIndex: 2 },
        { id: 'story-3', supportCardId: 'support-1', storyIndex: 3 }
      ]

      const result = validateSupportCard(card, mockIdols, stories)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('正常なSupportCard（SR、2話）の場合は検証が成功する', () => {
      const card: SupportCard = {
        id: 'support-2',
        name: 'テストサポートカード',
        rarity: 'SR',
        mainIdolId: 'idol-1',
        appearingIdolIds: []
      }

      const stories: SupportCardStory[] = [
        { id: 'story-1', supportCardId: 'support-2', storyIndex: 1 },
        { id: 'story-2', supportCardId: 'support-2', storyIndex: 2 }
      ]

      const result = validateSupportCard(card, mockIdols, stories)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('存在しない主Idolを参照している場合は検証が失敗する', () => {
      const card: SupportCard = {
        id: 'support-1',
        name: 'テストサポートカード',
        rarity: 'SSR',
        mainIdolId: 'non-existent-idol',
        appearingIdolIds: []
      }

      const stories: SupportCardStory[] = []

      const result = validateSupportCard(card, mockIdols, stories)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'SupportCard "support-1" のmainIdolId "non-existent-idol" が存在するIdolを参照していません'
      )
    })

    it('存在しない登場Idolを参照している場合は検証が失敗する', () => {
      const card: SupportCard = {
        id: 'support-1',
        name: 'テストサポートカード',
        rarity: 'SSR',
        mainIdolId: 'idol-1',
        appearingIdolIds: ['non-existent-idol']
      }

      const stories: SupportCardStory[] = []

      const result = validateSupportCard(card, mockIdols, stories)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'SupportCard "support-1" のappearingIdolIdsに含まれる "non-existent-idol" が存在するIdolを参照していません'
      )
    })

    it('ストーリー数が期待値と異なる場合は検証が失敗する（SSRで3話以外）', () => {
      const card: SupportCard = {
        id: 'support-1',
        name: 'テストサポートカード',
        rarity: 'SSR',
        mainIdolId: 'idol-1',
        appearingIdolIds: []
      }

      const stories: SupportCardStory[] = [
        { id: 'story-1', supportCardId: 'support-1', storyIndex: 1 }
        // 2話と3話が欠けている
      ]

      const result = validateSupportCard(card, mockIdols, stories)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'SupportCard "support-1" のストーリー数が不正です。期待値: 3、実際: 1'
      )
    })

    it('ストーリー数が期待値と異なる場合は検証が失敗する（SRで2話以外）', () => {
      const card: SupportCard = {
        id: 'support-2',
        name: 'テストサポートカード',
        rarity: 'SR',
        mainIdolId: 'idol-1',
        appearingIdolIds: []
      }

      const stories: SupportCardStory[] = [
        { id: 'story-1', supportCardId: 'support-2', storyIndex: 1 }
        // SRは2話であるべき
      ]

      const result = validateSupportCard(card, mockIdols, stories)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'SupportCard "support-2" のストーリー数が不正です。期待値: 2、実際: 1'
      )
    })

    it('ストーリーインデックスが不正な場合は検証が失敗する', () => {
      const card: SupportCard = {
        id: 'support-1',
        name: 'テストサポートカード',
        rarity: 'SSR',
        mainIdolId: 'idol-1',
        appearingIdolIds: []
      }

      const stories: SupportCardStory[] = [
        { id: 'story-1', supportCardId: 'support-1', storyIndex: 1 },
        { id: 'story-2', supportCardId: 'support-1', storyIndex: 2 },
        { id: 'story-3', supportCardId: 'support-1', storyIndex: 4 } // 4は不正
      ]

      const result = validateSupportCard(card, mockIdols, stories)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'SupportCard "support-1" のストーリーインデックスが不正です。期待値: [1, 2, 3]、実際: [1, 2, 4]'
      )
    })
  })

  describe('validateAllCards', () => {
    it('全てのカードが正常な場合は検証が成功する', () => {
      const data = {
        idols: mockIdols,
        produceCards: [
          {
            id: 'produce-1',
            name: 'テストプロデュースカード',
            rarity: 'SSR' as const,
            idolId: 'idol-1'
          }
        ],
        supportCards: [
          {
            id: 'support-1',
            name: 'テストサポートカード',
            rarity: 'SR' as const,
            mainIdolId: 'idol-1',
            appearingIdolIds: []
          }
        ],
        produceCardStories: [
          { id: 'story-1', produceCardId: 'produce-1', storyIndex: 1 },
          { id: 'story-2', produceCardId: 'produce-1', storyIndex: 2 },
          { id: 'story-3', produceCardId: 'produce-1', storyIndex: 3 }
        ],
        supportCardStories: [
          { id: 'story-4', supportCardId: 'support-1', storyIndex: 1 },
          { id: 'story-5', supportCardId: 'support-1', storyIndex: 2 }
        ]
      }

      const result = validateAllCards(data)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('ProduceCardに問題がある場合は検証が失敗する', () => {
      const data = {
        idols: mockIdols,
        produceCards: [
          {
            id: 'produce-1',
            name: 'テストプロデュースカード',
            rarity: 'SSR' as const,
            idolId: 'non-existent-idol' // 存在しないIdol
          }
        ],
        supportCards: [],
        produceCardStories: [],
        supportCardStories: []
      }

      const result = validateAllCards(data)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.includes('produce-1'))).toBe(true)
    })

    it('SupportCardに問題がある場合は検証が失敗する', () => {
      const data = {
        idols: mockIdols,
        produceCards: [],
        supportCards: [
          {
            id: 'support-1',
            name: 'テストサポートカード',
            rarity: 'SSR' as const,
            mainIdolId: 'non-existent-idol', // 存在しないIdol
            appearingIdolIds: []
          }
        ],
        produceCardStories: [],
        supportCardStories: []
      }

      const result = validateAllCards(data)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.includes('support-1'))).toBe(true)
    })

    it('複数のカードに問題がある場合は全てのエラーを返す', () => {
      const data = {
        idols: mockIdols,
        produceCards: [
          {
            id: 'produce-1',
            name: 'テストプロデュースカード',
            rarity: 'SSR' as const,
            idolId: 'non-existent-idol-1'
          }
        ],
        supportCards: [
          {
            id: 'support-1',
            name: 'テストサポートカード',
            rarity: 'SSR' as const,
            mainIdolId: 'non-existent-idol-2',
            appearingIdolIds: []
          }
        ],
        produceCardStories: [],
        supportCardStories: []
      }

      const result = validateAllCards(data)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
      expect(result.errors.some(e => e.includes('produce-1'))).toBe(true)
      expect(result.errors.some(e => e.includes('support-1'))).toBe(true)
    })
  })
})
