<template>
  <div class="tag-cloud">
    <div class="tag-cloud-header" v-if="showHeader">
      <h3>{{ title }}</h3>
      <button
        v-if="selectedTagId"
        class="clear-filter-btn"
        @click="clearFilter"
      >
        清除筛选
      </button>
    </div>

    <div v-if="loading" class="loading">
      加载中...
    </div>

    <div v-else-if="tags.length === 0" class="empty">
      暂无标签
    </div>

    <div v-else class="tags-container">
      <span
        v-for="tag in sortedTags"
        :key="tag.id"
        class="tag-item"
        :class="{ 
          active: tag.id === selectedTagId,
          'size-lg': tag.articleCount >= 10,
          'size-md': tag.articleCount >= 5 && tag.articleCount < 10,
          'size-sm': tag.articleCount < 5
        }"
        @click="handleTagClick(tag)"
      >
        {{ tag.name }}
        <span class="count" v-if="showCount">{{ tag.articleCount || 0 }}</span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useTagStore } from '../../stores/tag'
import { storeToRefs } from 'pinia'

const props = defineProps({
  title: {
    type: String,
    default: '标签'
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  showCount: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['select', 'clear'])

const tagStore = useTagStore()
const { tags, loading, selectedTagId } = storeToRefs(tagStore)

const sortedTags = computed(() => {
  return [...tags.value].sort((a, b) => {
    // Sort by article count descending, then by name
    const countDiff = (b.articleCount || 0) - (a.articleCount || 0)
    if (countDiff !== 0) return countDiff
    return a.name.localeCompare(b.name)
  })
})

function handleTagClick(tag) {
  if (tag.id === selectedTagId.value) {
    clearFilter()
  } else {
    tagStore.fetchTagArticles(tag.id)
    emit('select', tag)
  }
}

function clearFilter() {
  tagStore.clearTagFilter()
  emit('clear')
}

onMounted(() => {
  if (tags.value.length === 0) {
    tagStore.fetchTags()
  }
})
</script>

<style scoped>
.tag-cloud {
  padding: 16px;
  background: var(--bai);
  border-radius: 8px;
  border: 1px solid var(--hui);
}

.tag-cloud-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.tag-cloud-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.clear-filter-btn {
  padding: 4px 8px;
  background: transparent;
  color: var(--primary);
  font-size: 12px;
  border: 1px solid var(--primary);
  border-radius: 4px;
}

.clear-filter-btn:hover {
  background: rgba(74, 144, 217, 0.1);
}

.loading, .empty {
  text-align: center;
  padding: 16px;
  color: #999;
  font-size: 14px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: var(--danhui);
  color: #666;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.tag-item:hover {
  background: var(--primary);
  color: white;
}

.tag-item.active {
  background: var(--primary);
  color: white;
}

.tag-item.size-lg {
  font-size: 15px;
  padding: 8px 14px;
}

.tag-item.size-md {
  font-size: 14px;
}

.tag-item.size-sm {
  font-size: 12px;
  padding: 4px 10px;
}

.count {
  font-size: 0.85em;
  opacity: 0.8;
  background: rgba(0, 0, 0, 0.1);
  padding: 1px 5px;
  border-radius: 8px;
}

.tag-item.active .count,
.tag-item:hover .count {
  background: rgba(255, 255, 255, 0.2);
}
</style>
