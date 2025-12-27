<template>
  <AppLayout v-model:selectedTag="selectedTagId" @tag-select="handleTagSelect">
    <template v-if="isAuthenticated">
      <div class="home-content">
        <div class="content-header">
          <h2>
            {{ selectedTagId ? `标签: ${selectedTagName}` : '我的笔记' }}
            <button v-if="selectedTagId" class="clear-filter-btn" @click="clearTagFilter">
              ✕ 清除筛选
            </button>
          </h2>
          <button class="create-btn" @click="handleCreate">
            + 新建笔记
          </button>
        </div>

        <LoadingState v-if="loading" text="加载笔记中..." />

        <EmptyState
          v-else-if="displayArticles.length === 0"
          icon="📝"
          :title="selectedTagId ? '该标签下暂无笔记' : '还没有笔记'"
          :description="selectedTagId ? '尝试选择其他标签' : '点击上方按钮创建第一篇吧！'"
          :action-text="selectedTagId ? '清除筛选' : '新建笔记'"
          @action="selectedTagId ? clearTagFilter() : handleCreate()"
        />

        <div v-else class="articles-grid">
          <ArticleCard
            v-for="article in displayArticles"
            :key="article.id"
            :article="article"
          />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="welcome-section">
        <h2>欢迎使用代码笔记系统</h2>
        <p>一个随写、随存、随运行的代码笔记环境</p>
        <div class="features">
          <div class="feature">
            <span class="feature-icon">📝</span>
            <h3>Markdown + 代码</h3>
            <p>将文章和代码统一管理</p>
          </div>
          <div class="feature">
            <span class="feature-icon">▶️</span>
            <h3>即时运行</h3>
            <p>在浏览器中直接执行代码</p>
          </div>
          <div class="feature">
            <span class="feature-icon">🏷️</span>
            <h3>标签分类</h3>
            <p>智能搜索和分类管理</p>
          </div>
        </div>
        <div class="cta-buttons">
          <router-link to="/register" class="cta-primary">开始使用</router-link>
          <router-link to="/login" class="cta-secondary">已有账号？登录</router-link>
        </div>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { useArticleStore } from '../stores/article'
import { useTagStore } from '../stores/tag'
import { AppLayout } from '../components/layout'
import { LoadingState, EmptyState } from '../components/common'
import { ArticleCard } from '../components/article'

const router = useRouter()
const authStore = useAuthStore()
const articleStore = useArticleStore()
const tagStore = useTagStore()

const { isAuthenticated } = storeToRefs(authStore)
const { articles, loading: articlesLoading } = storeToRefs(articleStore)
const { tagArticles, tags, loading: tagsLoading } = storeToRefs(tagStore)

const selectedTagId = ref(null)

// 根据是否选中标签来显示对应的 loading 状态
const loading = computed(() => {
  if (selectedTagId.value) {
    return tagsLoading.value
  }
  return articlesLoading.value
})

const displayArticles = computed(() => {
  if (selectedTagId.value) {
    return tagArticles.value || []
  }
  return articles.value || []
})

const selectedTagName = computed(() => {
  if (!selectedTagId.value || !tags.value) return ''
  const tag = tags.value.find(t => t.id === selectedTagId.value)
  return tag?.name || ''
})

function handleTagSelect(tagId) {
  selectedTagId.value = tagId
  if (tagId) {
    tagStore.fetchTagArticles(tagId)
  } else {
    tagStore.clearTagFilter()
  }
}

function clearTagFilter() {
  selectedTagId.value = null
  tagStore.clearTagFilter()
}

function handleCreate() {
  router.push({ name: 'Editor' })
}

onMounted(() => {
  if (isAuthenticated.value) {
    articleStore.fetchArticles()
  }
})

watch(isAuthenticated, (newVal) => {
  if (newVal) {
    articleStore.fetchArticles()
  }
})
</script>

<style scoped>
.home-content {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.content-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 12px;
}

.clear-filter-btn {
  background: transparent;
  color: #999;
  border: 1px solid #ddd;
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
}

.clear-filter-btn:hover {
  background: var(--danhui);
  color: #666;
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

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.welcome-section {
  max-width: 800px;
  margin: 0 auto;
  padding: 60px 24px;
  text-align: center;
}

.welcome-section h2 {
  font-size: 32px;
  margin: 0 0 12px 0;
  color: #333;
}

.welcome-section > p {
  font-size: 18px;
  color: #666;
  margin: 0 0 48px 0;
}

.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 48px;
}

.feature {
  background: var(--bai);
  padding: 24px;
  border-radius: 8px;
  border: 1px solid var(--hui);
}

.feature-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 12px;
}

.feature h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.feature p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.cta-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.cta-primary, .cta-secondary {
  padding: 12px 32px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
}

.cta-primary {
  background: var(--primary);
  color: white;
}

.cta-primary:hover {
  background: var(--primary-hover);
  text-decoration: none;
}

.cta-secondary {
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
}

.cta-secondary:hover {
  background: rgba(74, 144, 217, 0.1);
  text-decoration: none;
}

@media (max-width: 768px) {
  .features {
    grid-template-columns: 1fr;
  }
  
  .articles-grid {
    grid-template-columns: 1fr;
  }
}
</style>
