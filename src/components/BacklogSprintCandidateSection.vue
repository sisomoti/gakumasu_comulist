<template>
  <section class="backlog-section backlog-sprint-candidate">
    <h3 class="section-title">スプリントバックログの候補</h3>
    <p v-if="summaryText" class="section-summary">{{ summaryText }}</p>
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
    <div class="backlog-divider" aria-hidden="true">
      <span class="divider-label">ここまで（スプリント候補）</span>
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
    /** 目安表示（例: "現在 3件" または "現在 3件 (読む期間7日間)"） */
    summaryText?: string
    /** 範囲選択で「ここまで」に含まれる storyId の集合 */
    selectedStoryIds?: Set<string>
  }>(),
  { summaryText: '', selectedStoryIds: () => new Set() }
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

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #333;
}

.section-summary {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 0.5rem 0;
}

.section-list {
  min-height: 2rem;
}

.draggable-list {
  min-height: 2rem;
}

.backlog-divider {
  margin-top: 0.75rem;
  padding: 0.5rem 0;
  border-top: 2px dashed #94a3b8;
  color: #64748b;
  font-size: 0.8125rem;
}

.divider-label {
  font-weight: 500;
}
</style>
