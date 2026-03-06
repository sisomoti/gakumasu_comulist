<template>
  <div class="backlog-filter-panel">
    <div class="filter-row">
      <label>
        <span class="label">カード種別</span>
        <select :value="filter.cardType ?? ''" @change="onCardTypeChange">
          <option value="">すべて</option>
          <option value="produce">プロデュース</option>
          <option value="support">サポート</option>
        </select>
      </label>
    </div>
    <div class="filter-row">
      <label>
        <span class="label">レアリティ</span>
        <select :value="rarityValue" @change="onRarityChange">
          <option value="">すべて</option>
          <option value="SSR">SSR</option>
          <option value="SR">SR</option>
          <option value="R">R</option>
        </select>
      </label>
    </div>
    <div class="filter-row">
      <label class="checkbox-label">
        <input type="checkbox" :checked="filter.unreadOnly === true" @change="onUnreadOnlyChange" />
        <span>未読のみ</span>
      </label>
    </div>
    <div class="filter-row">
      <label>
        <span class="label">検索</span>
        <input
          type="text"
          :value="filter.searchQuery ?? ''"
          placeholder="カード名・アイドル名"
          @input="onSearchInput"
        />
      </label>
    </div>
    <div class="filter-row">
      <label>
        <span class="label">並び順</span>
        <select :value="filter.sortBy ?? ''" @change="onSortByChange">
          <option value="">指定なし</option>
          <option value="name">名前</option>
          <option value="rarity">レアリティ</option>
          <option value="idolId">アイドル</option>
          <option value="cardId">カードID</option>
        </select>
        <select :value="filter.sortOrder ?? 'asc'" @change="onSortOrderChange">
          <option value="asc">昇順</option>
          <option value="desc">降順</option>
        </select>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BacklogFilter } from '../types/domain/backlog'

const props = defineProps<{
  filter: BacklogFilter
  setFilter: (partial: Partial<BacklogFilter>) => void
}>()

const rarityValue = computed(() => {
  const r = props.filter.rarity
  if (r === undefined) return ''
  return Array.isArray(r) ? (r[0] ?? '') : r
})

function onCardTypeChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  props.setFilter({
    cardType: v === '' ? undefined : (v as 'produce' | 'support'),
  })
}

function onRarityChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  props.setFilter({
    rarity: v === '' ? undefined : (v as 'SSR' | 'SR' | 'R'),
  })
}

function onUnreadOnlyChange(e: Event) {
  props.setFilter({ unreadOnly: (e.target as HTMLInputElement).checked })
}

function onSearchInput(e: Event) {
  props.setFilter({ searchQuery: (e.target as HTMLInputElement).value || undefined })
}

function onSortByChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  props.setFilter({
    sortBy: v === '' ? undefined : (v as 'name' | 'rarity' | 'idolId' | 'cardId'),
  })
}

function onSortOrderChange(e: Event) {
  props.setFilter({
    sortOrder: (e.target as HTMLSelectElement).value as 'asc' | 'desc',
  })
}
</script>

<style scoped>
.backlog-filter-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.5rem;
  padding: 0.75rem;
  background: var(--filter-bg, #f5f5f5);
  border-radius: 6px;
  margin-bottom: 1rem;
}

.filter-row label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-row .label {
  min-width: 4rem;
  font-size: 0.875rem;
}

.filter-row select,
.filter-row input[type='text'] {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.checkbox-label {
  cursor: pointer;
}
</style>
