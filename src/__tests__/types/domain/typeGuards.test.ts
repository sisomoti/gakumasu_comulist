import { describe, it, expect } from 'vitest'
import {
  isIdol,
  isRarity,
  isIdolCard,
  isProduceCard,
  isSupportCard,
  isStory,
  isProduceCardStory,
  isSupportCardStory
} from '../../../types/domain'

describe('typeGuards', () => {
  describe('isIdol', () => {
    it('正常なIdolオブジェクトの場合はtrueを返す', () => {
      const obj = { id: 'idol-1', name: 'アイドル1' }
      expect(isIdol(obj)).toBe(true)
    })

    it('idが欠けている場合はfalseを返す', () => {
      const obj = { name: 'アイドル1' }
      expect(isIdol(obj)).toBe(false)
    })

    it('nameが欠けている場合はfalseを返す', () => {
      const obj = { id: 'idol-1' }
      expect(isIdol(obj)).toBe(false)
    })

    it('idがstring型でない場合はfalseを返す', () => {
      const obj = { id: 123, name: 'アイドル1' }
      expect(isIdol(obj)).toBe(false)
    })

    it('nameがstring型でない場合はfalseを返す', () => {
      const obj = { id: 'idol-1', name: 123 }
      expect(isIdol(obj)).toBe(false)
    })

    it('nullの場合はfalseを返す', () => {
      expect(isIdol(null)).toBe(false)
    })

    it('undefinedの場合はfalseを返す', () => {
      expect(isIdol(undefined)).toBe(false)
    })
  })

  describe('isRarity', () => {
    it('SSRの場合はtrueを返す', () => {
      expect(isRarity('SSR')).toBe(true)
    })

    it('SRの場合はtrueを返す', () => {
      expect(isRarity('SR')).toBe(true)
    })

    it('Rの場合はtrueを返す', () => {
      expect(isRarity('R')).toBe(true)
    })

    it('それ以外の文字列の場合はfalseを返す', () => {
      expect(isRarity('N')).toBe(false)
      expect(isRarity('UR')).toBe(false)
      expect(isRarity('')).toBe(false)
    })

    it('文字列以外の場合はfalseを返す', () => {
      expect(isRarity(123)).toBe(false)
      expect(isRarity(null)).toBe(false)
      expect(isRarity(undefined)).toBe(false)
    })
  })

  describe('isIdolCard', () => {
    it('正常なIdolCardオブジェクトの場合はtrueを返す', () => {
      const obj = { id: 'card-1', name: 'カード1', rarity: 'SSR' }
      expect(isIdolCard(obj)).toBe(true)
    })

    it('idが欠けている場合はfalseを返す', () => {
      const obj = { name: 'カード1', rarity: 'SSR' }
      expect(isIdolCard(obj)).toBe(false)
    })

    it('nameが欠けている場合はfalseを返す', () => {
      const obj = { id: 'card-1', rarity: 'SSR' }
      expect(isIdolCard(obj)).toBe(false)
    })

    it('rarityが欠けている場合はfalseを返す', () => {
      const obj = { id: 'card-1', name: 'カード1' }
      expect(isIdolCard(obj)).toBe(false)
    })

    it('rarityが不正な値の場合はfalseを返す', () => {
      const obj = { id: 'card-1', name: 'カード1', rarity: 'N' }
      expect(isIdolCard(obj)).toBe(false)
    })
  })

  describe('isProduceCard', () => {
    it('正常なProduceCardオブジェクトの場合はtrueを返す', () => {
      const obj = {
        id: 'produce-1',
        name: 'プロデュースカード1',
        rarity: 'SSR',
        idolId: 'idol-1'
      }
      expect(isProduceCard(obj)).toBe(true)
    })

    it('idolIdが欠けている場合はfalseを返す', () => {
      const obj = {
        id: 'produce-1',
        name: 'プロデュースカード1',
        rarity: 'SSR'
      }
      expect(isProduceCard(obj)).toBe(false)
    })

    it('idolIdがstring型でない場合はfalseを返す', () => {
      const obj = {
        id: 'produce-1',
        name: 'プロデュースカード1',
        rarity: 'SSR',
        idolId: 123
      }
      expect(isProduceCard(obj)).toBe(false)
    })

    it('IdolCardの条件を満たさない場合はfalseを返す', () => {
      const obj = {
        id: 'produce-1',
        name: 'プロデュースカード1',
        rarity: 'N', // 不正なレアリティ
        idolId: 'idol-1'
      }
      expect(isProduceCard(obj)).toBe(false)
    })
  })

  describe('isSupportCard', () => {
    it('正常なSupportCardオブジェクトの場合はtrueを返す', () => {
      const obj = {
        id: 'support-1',
        name: 'サポートカード1',
        rarity: 'SSR',
        mainIdolId: 'idol-1',
        appearingIdolIds: ['idol-2', 'idol-3']
      }
      expect(isSupportCard(obj)).toBe(true)
    })

    it('appearingIdolIdsが空配列の場合もtrueを返す', () => {
      const obj = {
        id: 'support-1',
        name: 'サポートカード1',
        rarity: 'SSR',
        mainIdolId: 'idol-1',
        appearingIdolIds: []
      }
      expect(isSupportCard(obj)).toBe(true)
    })

    it('mainIdolIdが欠けている場合はfalseを返す', () => {
      const obj = {
        id: 'support-1',
        name: 'サポートカード1',
        rarity: 'SSR',
        appearingIdolIds: []
      }
      expect(isSupportCard(obj)).toBe(false)
    })

    it('appearingIdolIdsが欠けている場合はfalseを返す', () => {
      const obj = {
        id: 'support-1',
        name: 'サポートカード1',
        rarity: 'SSR',
        mainIdolId: 'idol-1'
      }
      expect(isSupportCard(obj)).toBe(false)
    })

    it('appearingIdolIdsが配列でない場合はfalseを返す', () => {
      const obj = {
        id: 'support-1',
        name: 'サポートカード1',
        rarity: 'SSR',
        mainIdolId: 'idol-1',
        appearingIdolIds: 'not-array'
      }
      expect(isSupportCard(obj)).toBe(false)
    })

    it('appearingIdolIdsにstring型以外が含まれる場合はfalseを返す', () => {
      const obj = {
        id: 'support-1',
        name: 'サポートカード1',
        rarity: 'SSR',
        mainIdolId: 'idol-1',
        appearingIdolIds: ['idol-2', 123] // 数値が含まれる
      }
      expect(isSupportCard(obj)).toBe(false)
    })
  })

  describe('isStory', () => {
    it('正常なStoryオブジェクトの場合はtrueを返す', () => {
      const obj = { id: 'story-1' }
      expect(isStory(obj)).toBe(true)
    })

    it('idが欠けている場合はfalseを返す', () => {
      const obj = {}
      expect(isStory(obj)).toBe(false)
    })

    it('idがstring型でない場合はfalseを返す', () => {
      const obj = { id: 123 }
      expect(isStory(obj)).toBe(false)
    })

    it('nullの場合はfalseを返す', () => {
      expect(isStory(null)).toBe(false)
    })
  })

  describe('isProduceCardStory', () => {
    it('正常なProduceCardStoryオブジェクトの場合はtrueを返す', () => {
      const obj = {
        id: 'story-1',
        produceCardId: 'produce-1',
        storyIndex: 1
      }
      expect(isProduceCardStory(obj)).toBe(true)
    })

    it('produceCardIdが欠けている場合はfalseを返す', () => {
      const obj = {
        id: 'story-1',
        storyIndex: 1
      }
      expect(isProduceCardStory(obj)).toBe(false)
    })

    it('storyIndexが欠けている場合はfalseを返す', () => {
      const obj = {
        id: 'story-1',
        produceCardId: 'produce-1'
      }
      expect(isProduceCardStory(obj)).toBe(false)
    })

    it('produceCardIdがstring型でない場合はfalseを返す', () => {
      const obj = {
        id: 'story-1',
        produceCardId: 123,
        storyIndex: 1
      }
      expect(isProduceCardStory(obj)).toBe(false)
    })

    it('storyIndexがnumber型でない場合はfalseを返す', () => {
      const obj = {
        id: 'story-1',
        produceCardId: 'produce-1',
        storyIndex: '1'
      }
      expect(isProduceCardStory(obj)).toBe(false)
    })

    it('Storyの条件を満たさない場合はfalseを返す', () => {
      const obj = {
        produceCardId: 'produce-1',
        storyIndex: 1
        // idが欠けている
      }
      expect(isProduceCardStory(obj)).toBe(false)
    })
  })

  describe('isSupportCardStory', () => {
    it('正常なSupportCardStoryオブジェクトの場合はtrueを返す', () => {
      const obj = {
        id: 'story-1',
        supportCardId: 'support-1',
        storyIndex: 1
      }
      expect(isSupportCardStory(obj)).toBe(true)
    })

    it('supportCardIdが欠けている場合はfalseを返す', () => {
      const obj = {
        id: 'story-1',
        storyIndex: 1
      }
      expect(isSupportCardStory(obj)).toBe(false)
    })

    it('storyIndexが欠けている場合はfalseを返す', () => {
      const obj = {
        id: 'story-1',
        supportCardId: 'support-1'
      }
      expect(isSupportCardStory(obj)).toBe(false)
    })

    it('supportCardIdがstring型でない場合はfalseを返す', () => {
      const obj = {
        id: 'story-1',
        supportCardId: 123,
        storyIndex: 1
      }
      expect(isSupportCardStory(obj)).toBe(false)
    })

    it('storyIndexがnumber型でない場合はfalseを返す', () => {
      const obj = {
        id: 'story-1',
        supportCardId: 'support-1',
        storyIndex: '1'
      }
      expect(isSupportCardStory(obj)).toBe(false)
    })

    it('Storyの条件を満たさない場合はfalseを返す', () => {
      const obj = {
        supportCardId: 'support-1',
        storyIndex: 1
        // idが欠けている
      }
      expect(isSupportCardStory(obj)).toBe(false)
    })
  })
})
