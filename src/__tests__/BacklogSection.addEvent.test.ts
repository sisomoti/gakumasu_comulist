import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import draggable from 'vuedraggable'
import BacklogSprintCandidateSection from '../components/BacklogSprintCandidateSection.vue'
import BacklogProductSection from '../components/BacklogProductSection.vue'
import type { BacklogItem as BacklogItemType } from '../types/domain/backlog'
import type { Story } from '../types/domain'
import type { ExternalGameData } from '../types/domain'

const STORY_IDS = ['A', 'B', 'E'] as const

function createStoriesMap(): Map<string, Story> {
  const map = new Map<string, Story>()
  STORY_IDS.forEach(id => map.set(id, { id }))
  return map
}

function createMinimalGameData(): ExternalGameData {
  return {
    version: '1.0.0-test',
    lastUpdated: new Date().toISOString(),
    idols: [{ id: 'idol-1', name: 'Test' }],
    produceCards: STORY_IDS.map(id => ({
      id: `card-${id}`,
      name: id,
      idolId: 'idol-1',
      rarity: 'R' as const,
    })),
    supportCards: [],
    produceCardStories: STORY_IDS.map(id => ({
      id,
      produceCardId: `card-${id}`,
      storyIndex: 1,
    })),
    supportCardStories: [],
  }
}

/**
 * 範囲外からスプリント/プロダクトへドロップしたときに @add が発火する。
 * 現状は @add を購読していないため onRankChange が呼ばれず保存されない。
 * このテストは「@add 発火時に onRankChange が呼ばれること」を検証する（実装前は失敗する）。
 */
describe('BacklogSprintCandidateSection: @add で onRankChange が呼ばれること', () => {
  it('他リストからアイテムが追加されたとき（@add）に onRankChange が新しい並びで呼ばれる', async () => {
    const onRankChange = vi.fn()
    const items: BacklogItemType[] = [
      { storyId: 'E', rank: 0, section: 'sprintBacklog' },
      { storyId: 'A', rank: 1, section: 'sprintBacklog' },
      { storyId: 'B', rank: 2, section: 'sprintBacklog' },
    ]
    const wrapper = mount(BacklogSprintCandidateSection, {
      props: {
        items,
        storiesMap: createStoriesMap(),
        gameData: createMinimalGameData(),
        isEditMode: true,
        onRankChange,
      },
    })
    await wrapper.vm.$nextTick()

    const draggableWrapper = wrapper.findComponent(draggable)
    expect(draggableWrapper.exists()).toBe(true)
    draggableWrapper.vm.$emit('add', { newIndex: 0 })

    expect(onRankChange).toHaveBeenCalledTimes(1)
    expect(onRankChange).toHaveBeenCalledWith(['E', 'A', 'B'])
  })
})

describe('BacklogProductSection: @add で onRankChange が呼ばれること', () => {
  it('他リストからアイテムが追加されたとき（@add）に onRankChange が新しい並びで呼ばれる', async () => {
    const onRankChange = vi.fn()
    const items: BacklogItemType[] = [
      { storyId: 'E', rank: 0, section: 'productBacklog' },
      { storyId: 'A', rank: 1, section: 'productBacklog' },
      { storyId: 'B', rank: 2, section: 'productBacklog' },
    ]
    const wrapper = mount(BacklogProductSection, {
      props: {
        items,
        storiesMap: createStoriesMap(),
        gameData: createMinimalGameData(),
        isEditMode: true,
        onRankChange,
      },
    })
    await wrapper.vm.$nextTick()

    const draggableWrapper = wrapper.findComponent(draggable)
    expect(draggableWrapper.exists()).toBe(true)
    draggableWrapper.vm.$emit('add', { newIndex: 0 })

    expect(onRankChange).toHaveBeenCalledTimes(1)
    expect(onRankChange).toHaveBeenCalledWith(['E', 'A', 'B'])
  })
})
