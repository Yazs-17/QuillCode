<template>
  <div class="article-card" @click="handleClick">
    <div class="card-header">
      <div class="card-badges">
        <span class="article-type" :class="article.type">{{ typeLabel }}</span>
        <span v-if="hasShare" class="share-badge css-icon icon-link" title="已分享"></span>
      </div>
      <span class="article-language">{{ article.language }}</span>
    </div>
    <h3 class="article-title">{{ article.title }}</h3>
    <p class="article-preview" v-if="article.content">
      {{ contentPreview }}
    </p>
    <div class="card-footer">
      <div class="tags" v-if="tags.length">
        <span class="tag" v-for="tag in tags" :key="tag.id">{{ tag.name }}</span>
      </div>
      <span class="article-date">{{ formattedDate }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  article: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const typeLabel = computed(() => {
  const labels = {
    algorithm: '算法',
    snippet: '代码片段',
    html: 'HTML/Vue'
  }
  return labels[props.article.type] || props.article.type
})

const contentPreview = computed(() => {
  const content = props.article.content || ''
  return content.length > 100 ? content.slice(0, 100) + '...' : content
})

const tags = computed(() => {
  if (!props.article.articleTags) return []
  return props.article.articleTags.map(at => at.tag).filter(Boolean)
})

const hasShare = computed(() => {
  return props.article.hasShare || props.article.shareCount > 0
})

const formattedDate = computed(() => {
  const date = new Date(props.article.updatedAt || props.article.createdAt)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
})

function handleClick() {
  router.push({ name: 'Article', params: { id: props.article.id } })
}
</script>

<style scoped>
.article-card {
  background: var(--bai);
  border: 1px solid var(--hui);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
}

.article-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-badges {
  display: flex;
  align-items: center;
  gap: 6px;
}

.article-type {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.article-type.algorithm {
  background: #e3f2fd;
  color: #1976d2;
}

.article-type.snippet {
  background: #e8f5e9;
  color: #388e3c;
}

.article-type.html {
  background: #fff3e0;
  color: #f57c00;
}

.share-badge {
  font-size: 12px;
  cursor: help;
  color: var(--primary);
}

.article-language {
  font-size: 12px;
  color: #666;
}

.article-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.article-preview {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag {
  font-size: 11px;
  padding: 2px 6px;
  background: var(--danhui);
  border-radius: 3px;
  color: #666;
}

.article-date {
  font-size: 12px;
  color: #999;
}
</style>
