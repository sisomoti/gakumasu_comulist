<template>
  <div class="app">
    <h1>学マス 未読コミュ管理</h1>
    <p v-if="loading">読む順一覧を読み込み中...</p>
    <BacklogView v-else-if="ready" />
    <p v-else>データの読み込みに失敗しました。</p>
  </div>
</template>

<script setup lang="ts">
import { ref, provide, onMounted } from 'vue'
import BacklogView from './components/BacklogView.vue'
import { ManualDataSource } from './services/data-source/ManualDataSource'
import { StoryRepository } from './services/repository/StoryRepository'
import { LocalStorageService } from './services/storage/LocalStorageService'
import { useReadStatus } from './composables/useReadStatus'
import { useCardOwnership } from './composables/useCardOwnership'
import type { IStoryRepository } from './services/interfaces/IStoryRepository'
import type { ExternalGameData } from './types/domain'

const loading = ref(true)
const ready = ref(false)

const repositoryRef = ref<IStoryRepository | null>(null)
const gameDataRef = ref<ExternalGameData | null>(null)
const readStatusRef = ref<ReturnType<typeof useReadStatus> | null>(null)
const cardOwnershipRef = ref<ReturnType<typeof useCardOwnership> | null>(null)

provide('repository', repositoryRef)
provide('gameData', gameDataRef)
provide('readStatus', readStatusRef)
provide('cardOwnership', cardOwnershipRef)

onMounted(async () => {
  try {
    const dataSource = new ManualDataSource('dummy')
    const result = await dataSource.fetchCards()
    const gameData: ExternalGameData = {
      version: result.idols?.[0] ? '1.0.0-dummy' : '1.0.0',
      lastUpdated: new Date().toISOString(),
      idols: result.idols,
      produceCards: result.produceCards,
      supportCards: result.supportCards,
      produceCardStories: result.produceCardStories,
      supportCardStories: result.supportCardStories,
    }
    const storageService = new LocalStorageService()
    gameDataRef.value = gameData
    repositoryRef.value = new StoryRepository(gameData)
    readStatusRef.value = useReadStatus(storageService)
    cardOwnershipRef.value = useCardOwnership(storageService)
    ready.value = true
  } catch {
    ready.value = false
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.app {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

h1 {
  color: #42b983;
  margin-bottom: 1rem;
}

p {
  margin-top: 1rem;
  font-size: 1rem;
}
</style>
