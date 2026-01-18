import { describe, it, expect } from 'vitest'
import {
  calculateStoryCount,
  calculateProduceCardStoryCount,
  calculateSupportCardStoryCount
} from '../../../utils/domain/storyCountCalculator'
import type { ProduceCard, SupportCard } from '../../../types/domain'

describe('storyCountCalculator', () => {
  describe('calculateStoryCount', () => {
    describe('ProduceCardの場合', () => {
      it('SSRの場合は3話を返す', () => {
        const result = calculateStoryCount('produce', 'SSR')
        expect(result).toBe(3)
      })

      it('SRの場合は0話を返す', () => {
        const result = calculateStoryCount('produce', 'SR')
        expect(result).toBe(0)
      })

      it('Rの場合は0話を返す', () => {
        const result = calculateStoryCount('produce', 'R')
        expect(result).toBe(0)
      })
    })

    describe('SupportCardの場合', () => {
      it('SSRの場合は3話を返す', () => {
        const result = calculateStoryCount('support', 'SSR')
        expect(result).toBe(3)
      })

      it('SRの場合は2話を返す', () => {
        const result = calculateStoryCount('support', 'SR')
        expect(result).toBe(2)
      })

      it('Rの場合は2話を返す', () => {
        const result = calculateStoryCount('support', 'R')
        expect(result).toBe(2)
      })
    })
  })

  describe('calculateProduceCardStoryCount', () => {
    it('SSRのProduceCardの場合は3話を返す', () => {
      const card: ProduceCard = {
        id: 'produce-1',
        name: 'テストプロデュースカード',
        rarity: 'SSR',
        idolId: 'idol-1'
      }

      const result = calculateProduceCardStoryCount(card)
      expect(result).toBe(3)
    })

    it('SRのProduceCardの場合は0話を返す', () => {
      const card: ProduceCard = {
        id: 'produce-2',
        name: 'テストプロデュースカード',
        rarity: 'SR',
        idolId: 'idol-1'
      }

      const result = calculateProduceCardStoryCount(card)
      expect(result).toBe(0)
    })

    it('RのProduceCardの場合は0話を返す', () => {
      const card: ProduceCard = {
        id: 'produce-3',
        name: 'テストプロデュースカード',
        rarity: 'R',
        idolId: 'idol-1'
      }

      const result = calculateProduceCardStoryCount(card)
      expect(result).toBe(0)
    })
  })

  describe('calculateSupportCardStoryCount', () => {
    it('SSRのSupportCardの場合は3話を返す', () => {
      const card: SupportCard = {
        id: 'support-1',
        name: 'テストサポートカード',
        rarity: 'SSR',
        mainIdolId: 'idol-1',
        appearingIdolIds: []
      }

      const result = calculateSupportCardStoryCount(card)
      expect(result).toBe(3)
    })

    it('SRのSupportCardの場合は2話を返す', () => {
      const card: SupportCard = {
        id: 'support-2',
        name: 'テストサポートカード',
        rarity: 'SR',
        mainIdolId: 'idol-1',
        appearingIdolIds: []
      }

      const result = calculateSupportCardStoryCount(card)
      expect(result).toBe(2)
    })

    it('RのSupportCardの場合は2話を返す', () => {
      const card: SupportCard = {
        id: 'support-3',
        name: 'テストサポートカード',
        rarity: 'R',
        mainIdolId: 'idol-1',
        appearingIdolIds: []
      }

      const result = calculateSupportCardStoryCount(card)
      expect(result).toBe(2)
    })
  })
})
