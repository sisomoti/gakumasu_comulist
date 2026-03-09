<template>
  <div class="backlog-view">
    <div class="toolbar">
      <button v-if="!isEditMode" type="button" class="btn-edit" @click="isEditMode = true">
        順序を編集
      </button>
      <template v-else>
        <button type="button" class="btn-done" @click="isEditMode = false">完了</button>
        <button type="button" class="btn-apply-order" @click="applyIdolOrder">
          おすすめ順を適用
        </button>
        <button
          v-if="selectedStoryIds.size > 0"
          type="button"
          class="btn-up-to"
          @click="confirmUpToRank"
        >
          ここまでをスプリント候補にする
        </button>
      </template>
    </div>

    <BacklogFilterPanel :filter="backlog.filter.value" :set-filter="backlog.setFilter" />

    <BacklogSprintCandidateSection
      :items="sprintBacklogItems"
      :stories-map="storiesMap"
      :game-data="gameData"
      :is-edit-mode="isEditMode"
      :summary-text="sprintCandidateSummaryText"
      :selected-story-ids="selectedStoryIds"
      :on-rank-change="onSprintRankChange"
      @select-item="handleSelectItem"
    />

    <BacklogProductSection
      :items="productBacklogItems"
      :stories-map="storiesMap"
      :game-data="gameData"
      :is-edit-mode="isEditMode"
      :selected-story-ids="selectedStoryIds"
      :on-rank-change="onProductRankChange"
      @select-item="handleSelectItem"
    />

    <BacklogOutOfScopeSection
      :items="outOfScopeItems"
      :stories-map="storiesMap"
      :game-data="gameData"
      :is-edit-mode="isEditMode"
      :on-drop-to-out-of-scope="backlog.moveToOutOfScope"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject, onMounted } from 'vue'
import BacklogFilterPanel from './BacklogFilterPanel.vue'
import BacklogSprintCandidateSection from './BacklogSprintCandidateSection.vue'
import BacklogProductSection from './BacklogProductSection.vue'
import BacklogOutOfScopeSection from './BacklogOutOfScopeSection.vue'
import type { IStoryRepository } from '../services/interfaces/IStoryRepository'
import type { ExternalGameData } from '../types/domain'
import type { Story } from '../types/domain'
import type { BacklogItem as BacklogItemType } from '../types/domain/backlog'
import { useStories } from '../composables/useStories'
import { useBacklog } from '../composables/useBacklog'
import { useSprint } from '../composables/useSprint'
import { sortByIdolOrder } from '../utils/backlogSort'
import { getSprintDurationDays } from '../utils/sprintUtils'
import type { useReadStatus } from '../composables/useReadStatus'
import type { useCardOwnership } from '../composables/useCardOwnership'

const repositoryRef = inject<{ value: IStoryRepository | null }>('repository')
const gameDataRef = inject<{ value: ExternalGameData | null }>('gameData')
const readStatusRef = inject<{ value: ReturnType<typeof useReadStatus> | null }>('readStatus')
const cardOwnershipRef = inject<{ value: ReturnType<typeof useCardOwnership> | null }>(
  'cardOwnership'
)

if (
  !repositoryRef?.value ||
  !gameDataRef?.value ||
  !readStatusRef?.value ||
  !cardOwnershipRef?.value
) {
  throw new Error(
    'BacklogView requires provide("repository"), provide("gameData"), provide("readStatus"), provide("cardOwnership") to be set'
  )
}

const repository = repositoryRef.value
const gameData = gameDataRef.value
const readStatus = readStatusRef.value
const cardOwnership = cardOwnershipRef.value

const stories = useStories(repository, gameData, readStatus, cardOwnership)
const backlog = useBacklog()
const sprint = useSprint()

onMounted(() => {
  stories.setFilter(backlog.filter.value)
})

watch(
  () => backlog.filter.value,
  f => {
    stories.setFilter(f)
  },
  { deep: true }
)

const isEditMode = ref(false)

/** 範囲選択で「ここまで」に含める storyId の集合（編集モードのみ使用） */
const selectedStoryIds = ref<Set<string>>(new Set())
/** 範囲拡張の基準となる storyId（Shift+クリックでここから範囲選択） */
const anchorStoryId = ref<string | null>(null)

const combinedSprintProductIds = computed(() => [
  ...sprintBacklogItems.value.map(i => i.storyId),
  ...productBacklogItems.value.map(i => i.storyId),
])

const displayCandidateSet = computed(() => {
  const ids = new Set(stories.filteredStories.value.map(s => s.id))
  return ids
})

const storiesMap = computed(() => {
  const map = new Map<string, Story>()
  for (const s of stories.filteredStories.value) {
    map.set(s.id, s)
  }
  return map
})

const sprintBacklogItems = computed(() => {
  return backlog.items.value
    .filter(i => i.section === 'sprintBacklog' && displayCandidateSet.value.has(i.storyId))
    .sort((a, b) => a.rank - b.rank)
})

/** スプリント候補の目安表示（現在 X件 / 現在 X件 (読む期間○日間)） */
const sprintCandidateSummaryText = computed(() => {
  const n = sprintBacklogItems.value.length
  if (n === 0) return ''
  const days = getSprintDurationDays(sprint.activeSprint.value)
  return days != null ? `現在 ${n}件 (読む期間${days}日間)` : `現在 ${n}件`
})

const productBacklogItems = computed(() => {
  return backlog.items.value
    .filter(i => i.section === 'productBacklog' && displayCandidateSet.value.has(i.storyId))
    .sort((a, b) => a.rank - b.rank)
})

const outOfScopeItems = computed(() => {
  const fromBacklog = backlog.items.value
    .filter(i => i.section === 'outOfScope' && displayCandidateSet.value.has(i.storyId))
    .sort((a, b) => a.rank - b.rank)
  const backlogStoryIds = new Set(backlog.items.value.map(i => i.storyId))
  const maxRank =
    backlog.items.value.length > 0 ? Math.max(...backlog.items.value.map(i => i.rank)) : 0
  const virtual: BacklogItemType[] = []
  let rank = maxRank + 1
  for (const s of stories.filteredStories.value) {
    if (!backlogStoryIds.has(s.id)) {
      virtual.push({ storyId: s.id, rank: rank++, section: 'outOfScope' })
    }
  }
  return [...fromBacklog, ...virtual]
})

function onSprintRankChange(ordered: string[]) {
  const productIds = productBacklogItems.value.map(i => i.storyId)
  const outIds = outOfScopeItems.value.map(i => i.storyId)
  backlog.setRanks([...ordered, ...productIds, ...outIds])
}

function onProductRankChange(ordered: string[]) {
  const sprintIds = sprintBacklogItems.value.map(i => i.storyId)
  const outIds = outOfScopeItems.value.map(i => i.storyId)
  backlog.setRanks([...sprintIds, ...ordered, ...outIds])
}

function applyIdolOrder() {
  const sprintIds = sprintBacklogItems.value.map(i => i.storyId)
  const productIds = productBacklogItems.value.map(i => i.storyId)
  const outIds = outOfScopeItems.value.map(i => i.storyId)
  const combined = [...sprintIds, ...productIds]
  const ordered = sortByIdolOrder(combined, storiesMap.value, gameData)
  backlog.setRanks([...ordered, ...outIds])
}

function handleSelectItem(storyId: string, shiftKey: boolean) {
  const list = combinedSprintProductIds.value
  if (!shiftKey) {
    selectedStoryIds.value = new Set([storyId])
    anchorStoryId.value = storyId
    return
  }
  if (anchorStoryId.value == null) {
    selectedStoryIds.value = new Set([storyId])
    anchorStoryId.value = storyId
    return
  }
  const a = list.indexOf(anchorStoryId.value)
  const b = list.indexOf(storyId)
  if (a === -1 || b === -1) {
    selectedStoryIds.value = new Set([storyId])
    anchorStoryId.value = storyId
    return
  }
  const [lo, hi] = a <= b ? [a, b] : [b, a]
  selectedStoryIds.value = new Set(list.slice(lo, hi + 1))
}

function confirmUpToRank() {
  const rankMap = new Map(backlog.items.value.map(i => [i.storyId, i.rank]))
  let maxRank = -1
  for (const id of selectedStoryIds.value) {
    const r = rankMap.get(id)
    if (r !== undefined && maxRank < r) maxRank = r
  }
  if (maxRank >= 0) backlog.setInSprintBacklogUpToRank(maxRank)
  selectedStoryIds.value = new Set()
  anchorStoryId.value = null
}
</script>

<style scoped>
.backlog-view {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.toolbar {
  margin-bottom: 1rem;
}

.btn-edit,
.btn-done {
  padding: 0.5rem 1rem;
  font-size: 0.9375rem;
  border-radius: 6px;
  border: 1px solid #42b983;
  background: #42b983;
  color: #fff;
  cursor: pointer;
}

.btn-edit:hover,
.btn-done:hover {
  background: #35a372;
  border-color: #35a372;
}

.btn-apply-order {
  margin-left: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.9375rem;
  border-radius: 6px;
  border: 1px solid #64748b;
  background: #fff;
  color: #334155;
  cursor: pointer;
}

.btn-apply-order:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.btn-up-to {
  margin-left: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.9375rem;
  border-radius: 6px;
  border: 1px solid #0ea5e9;
  background: #0ea5e9;
  color: #fff;
  cursor: pointer;
}

.btn-up-to:hover {
  background: #0284c7;
  border-color: #0284c7;
}
</style>
