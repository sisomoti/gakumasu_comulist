<template>
  <section class="backlog-section backlog-out-of-scope">
    <h3 class="section-title">未計画のコミュ一覧</h3>
    <p class="section-desc">
      上の「直近で読みたい」「そのうち読みたい」へドラッグ＆ドロップすると、読む予定に追加できます。
    </p>
    <div class="section-list drop-zone" :class="{ 'drop-zone-active': isEditMode }">
      <draggable
        v-if="isEditMode"
        v-model="localList"
        item-key="storyId"
        tag="div"
        class="draggable-list"
        :group="{ name: 'backlog', pull: true, put: true }"
        @end="onDragEnd"
        @add="onAdd"
      >
        <template #item="{ element }">
          <BacklogItem
            :story="storiesMap.get(element.storyId)!"
            :backlog-item="element"
            :is-edit-mode="true"
            :game-data="gameData"
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
      <p v-if="items.length === 0 && !isEditMode" class="empty-hint">
        ここにドロップすると読む予定から外れます
      </p>
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

const props = defineProps<{
  items: BacklogItemType[]
  storiesMap: Map<string, Story>
  gameData: ExternalGameData
  isEditMode: boolean
  onDropToOutOfScope?: (storyId: string) => void
  /** 範囲外リスト内の順序変更時（並び替え・他セクションからのドロップ含む） */
  onRankChange?: (orderedStoryIds: string[]) => void
}>()

const localList = ref<BacklogItemType[]>([])

/** 範囲外は「追加・削除」時だけ props と同期する。同一メンバーの順序変更は localList を優先し @end で保存する。 */
function hasSameItemSet(a: BacklogItemType[], b: BacklogItemType[]) {
  if (a.length !== b.length) return false
  const bIds = new Set(b.map(i => i.storyId))
  return a.every(i => bIds.has(i.storyId))
}

watch(
  () => props.items,
  newItems => {
    if (!hasSameItemSet(localList.value, newItems)) {
      localList.value = [...newItems]
    }
  },
  { immediate: true }
)

function onDragEnd() {
  props.onRankChange?.(localList.value.map(i => i.storyId))
}

function onAdd(evt: { newIndex: number }) {
  const added = localList.value[evt.newIndex]
  if (added?.storyId) props.onDropToOutOfScope?.(added.storyId)
  props.onRankChange?.(localList.value.map(i => i.storyId))
}
</script>

<style scoped>
.backlog-section {
  margin-bottom: 1.5rem;
}

.section-desc {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 0.5rem 0;
  line-height: 1.5;
}

.section-list {
  min-height: 3rem;
  padding: 0.5rem;
  border: 1px dashed #ccc;
  border-radius: 6px;
  background: #fafafa;
}

.section-list.drop-zone-active {
  border-color: #42b983;
  background: #f0fdf4;
}

.empty-hint {
  font-size: 0.875rem;
  color: #888;
  margin: 0.5rem 0 0 0;
}
</style>
