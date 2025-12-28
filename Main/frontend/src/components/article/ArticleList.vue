<template>
  <div class="article-list">
    <div class="list-header">
      <h2>我的片段</h2>
      <button class="create-btn" @click="handleCreate">
        + 新建片段
      </button>
    </div>

    <div class="list-content">
      <aside class="sidebar">
        <TagCloud
          title="标签筛选"
          @select="handleTagSelect"
          @clear="handleTagClear"
        />
      </aside>

      <main class="main-content">
        <div v-if="loading" class="loading">
          加载中...
        </div>

        <div v-else-if="error" class="error">
          {{ error }}
          <button @click="retry">重试</button>
        </div>

        <div v-else-if="displayArticles.length === 0" class="empty">
          <p v-if="selectedTagId">该标签下暂无笔记</p>
          <p v-else>还没有笔记，点击上方按钮创建第一篇吧！</p>
        </div>

        <div v-else class="articles-grid">
          <ArticleCard
            v-for="article in displayArticles"
            :key="article.id"
            :article="article"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useArticleStore } from '../../stores/article'
import { useTagStore } from '../../stores/tag'
import ArticleCard from './ArticleCard.vue'
import { TagCloud } from '../tag'

const router = useRouter()
const articleStore = useArticleStore()
const tagStore = useTagStore()
const { articles, loading, error } = storeToRefs(articleStore)
const { selectedTagId, tagArticles } = storeToRefs(tagStore)

// Show filtered articles when a tag is selected, otherwise show all
const displayArticles = computed(() => {
  if (selectedTagId.value) {
    return tagArticles.value
  }
  return articles.value
})

onMounted(() => {
  articleStore.fetchArticles()
})

function handleCreate() {
  router.push({ name: 'Editor' })
}

function retry() {
  articleStore.clearError()
  articleStore.fetchArticles()
}

function handleTagSelect(tag) {
  // Tag articles are fetched by TagCloud component
}

function handleTagClear() {
  // Clear filter handled by TagCloud
}
</script>

<style scoped>
.article-list {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.list-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.create-btn {
  background: var(--primary);
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
}

.create-btn:hover {
  background: var(--primary-hover);
}

.list-content {
  display: flex;
  gap: 24px;
}

.sidebar {
  flex: 0 0 250px;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.loading, .error, .empty {
  text-align: center;
  padding: 48px;
  color: #666;
}

.error {
  color: var(--danger);
}

.error button {
  margin-top: 12px;
  background: var(--danger);
}

.empty p {
  margin: 0;
  font-size: 16px;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

@media (max-width: 768px) {
  .list-content {
    flex-direction: column;
  }

  .sidebar {
    flex: none;
  }
}
</style>
