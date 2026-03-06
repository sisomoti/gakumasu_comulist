<template>
  <div
    class="backlog-item"
    :class="{ 'is-edit-mode': isEditMode }"
    :data-story-id="backlogItem.storyId"
  >
    <span v-if="isEditMode" class="drag-handle" aria-hidden="true">⋮⋮</span>
    <span class="item-name">{{ displayName }}</span>
    <span class="item-meta">{{ displayMeta }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Story } from '../types/domain'
import type { BacklogItem as BacklogItemType } from '../types/domain/backlog'
import type { ExternalGameData } from '../types/domain'
import { getCardFromStory, getMainIdolIdFromStory } from '../types/domain'

const props = withDefaults(
  defineProps<{
    story: Story
    backlogItem: BacklogItemType
    isEditMode: boolean
    gameData?: ExternalGameData
  }>(),
  { gameData: undefined }
)

const displayName = computed(() => {
  if (!props.gameData) return props.story.id
  const card = getCardFromStory(props.story, props.gameData)
  return card?.name ?? props.story.id
})

const displayMeta = computed(() => {
  if (!props.gameData) return ''
  const card = getCardFromStory(props.story, props.gameData)
  const idolId = getMainIdolIdFromStory(props.story, props.gameData)
  const idol = idolId ? props.gameData.idols.find(i => i.id === idolId) : undefined
  const parts: string[] = []
  if (card) parts.push(card.rarity)
  if (idol) parts.push(idol.name)
  return parts.join(' · ')
})
</script>

<style scoped>
.backlog-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-bottom: 0.25rem;
}

.backlog-item.is-edit-mode {
  cursor: grab;
}

.backlog-item.is-edit-mode:active {
  cursor: grabbing;
}

.drag-handle {
  cursor: grab;
  color: #999;
  font-size: 1rem;
  user-select: none;
}

.item-name {
  flex: 1;
  font-size: 0.9375rem;
}

.item-meta {
  font-size: 0.8125rem;
  color: #666;
}
</style>
