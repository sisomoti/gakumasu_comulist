import { describe, it, expect } from 'vitest'
import { sortByIdolOrder } from '../../utils/backlogSort'
import type { Story, ExternalGameData, ProduceCardStory } from '../../types/domain'

function produceStory(id: string, produceCardId: string, storyIndex = 1): ProduceCardStory {
  return { id, produceCardId, storyIndex }
}

describe('backlogSort', () => {
  const gameData: ExternalGameData = {
    idols: [
      { id: 'idol-a', name: 'A' },
      { id: 'idol-b', name: 'B' },
    ],
    produceCards: [
      { id: 'card-1', name: 'C1', rarity: 'R', idolId: 'idol-b' },
      { id: 'card-2', name: 'C2', rarity: 'SSR', idolId: 'idol-a' },
      { id: 'card-3', name: 'C3', rarity: 'SR', idolId: 'idol-a' },
    ],
    supportCards: [],
  }

  const story1 = produceStory('s1', 'card-1')
  const story2 = produceStory('s2', 'card-2')
  const story3 = produceStory('s3', 'card-3')
  const storiesMap = new Map<string, Story>([
    ['s1', story1],
    ['s2', story2],
    ['s3', story3],
  ])

  describe('sortByIdolOrder', () => {
    it('アイドル順（gameData.idolsの並び）、次にレアリティ順 SSR→SR→R、同一なら story id 順', () => {
      const storyIds = ['s1', 's2', 's3']
      const result = sortByIdolOrder(storyIds, storiesMap, gameData)
      expect(result).toEqual(['s2', 's3', 's1'])
    })

    it('入力順が違っても同じソート結果になる', () => {
      const result = sortByIdolOrder(['s3', 's1', 's2'], storiesMap, gameData)
      expect(result).toEqual(['s2', 's3', 's1'])
    })

    it('空配列の場合は空を返す', () => {
      expect(sortByIdolOrder([], storiesMap, gameData)).toEqual([])
    })
  })
})
