<template>
  <section class="backlog-section backlog-product">
    <h4 class="section-title section-title-with-divider">そのうち読みたい</h4>
    <div class="section-list">
      <draggable
        v-if="isEditMode"
        v-model="localList"
        item-key="storyId"
        tag="div"
        class="draggable-list"
        :group="{ name: 'backlog', pull: true, put: true }"
        handle=".drag-handle"
        @end="onDragEnd"
      >
        <template #item="{ element }">
          <BacklogItem
            :story="storiesMap.get(element.storyId)!"
            :backlog-item="element"
            :is-edit-mode="true"
            :game-data="gameData"
            :selected="selectedStoryIds.has(element.storyId)"
            @select="ev => emit('select-item', element.storyId, ev.shiftKey)"
          />
        </template>
      </draggable>
      <template v-else>
        <BacklogItem
          v-for="item in items"
          :key="item.storyId"
          :story="storiesMap.get(item.storyId)!"
          :backlog-item="item"
          :is-edit-mode="false"
          :game-data="gameData"
        />
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'
import BacklogItem from './BacklogItem.vue'
import type { Story } from '../types/domain'
import type { BacklogItem as BacklogItemType } from '../types/domain/backlog'
import type { ExternalGameData } from '../types/domain'

const props = withDefaults(
  defineProps<{
    items: BacklogItemType[]
    storiesMap: Map<string, Story>
    gameData: ExternalGameData
    isEditMode: boolean
    onRankChange?: (orderedStoryIds: string[]) => void
    selectedStoryIds?: Set<string>
  }>(),
  { selectedStoryIds: () => new Set() }
)

const emit = defineEmits<{
  'select-item': [storyId: string, shiftKey: boolean]
}>()

const localList = ref<BacklogItemType[]>([])

watch(
  () => props.items,
  newItems => {
    localList.value = [...newItems]
  },
  { immediate: true }
)

function onDragEnd() {
  props.onRankChange?.(localList.value.map(i => i.storyId))
}
</script>

<style scoped>
.backlog-section {
  margin-bottom: 1.5rem;
}

.section-title-with-divider {
  padding-top: 0.75rem;
  border-top: 2px dashed #94a3b8;
  margin-top: 0.25rem;
}

.section-list {
  min-height: 2rem;
}

.draggable-list {
  min-height: 2rem;
}
</style>
