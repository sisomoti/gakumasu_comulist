<template>
  <div class="backlog-view">
    <div class="toolbar">
      <button v-if="!isEditMode" type="button" class="btn-edit" @click="isEditMode = true">
        順序を編集
      </button>
      <button v-else type="button" class="btn-done" @click="isEditMode = false">完了</button>
    </div>

    <BacklogFilterPanel :filter="backlog.filter.value" :set-filter="backlog.setFilter" />

    <BacklogSprintCandidateSection
      :items="sprintBacklogItems"
      :stories-map="storiesMap"
      :game-data="gameData"
      :is-edit-mode="isEditMode"
      :on-rank-change="onSprintRankChange"
    />

    <BacklogProductSection
      :items="productBacklogItems"
      :stories-map="storiesMap"
      :game-data="gameData"
      :is-edit-mode="isEditMode"
      :on-rank-change="onProductRankChange"
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
</style>
