<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUiStore } from '../../stores/ui'
import { useTagStore } from '../../stores/tag'

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle', 'tagSelect'])

const router = useRouter()
const uiStore = useUiStore()
const tagStore = useTagStore()
const { sidebarOpen } = storeToRefs(uiStore)
const { tags, loading: tagsLoading } = storeToRefs(tagStore)

const selectedTagId = defineModel('selectedTag', { default: null })

const sortedTags = computed(() => {
  if (!tags.value) return []
  return [...tags.value].sort((a, b) => (b.articleCount || 0) - (a.articleCount || 0))
})

function handleTagClick(tagId) {
  if (selectedTagId.value === tagId) {
    selectedTagId.value = null
  } else {
    selectedTagId.value = tagId
  }
  emit('tagSelect', selectedTagId.value)
}

function createNewArticle() {
  router.push({ name: 'Editor' })
}

function toggleSidebar() {
  uiStore.toggleSidebar()
  emit('toggle', sidebarOpen.value)
}
</script>

<template>
  <aside class="app-sidebar" :class="{ collapsed: !sidebarOpen }">
    <div class="sidebar-header">
      <h3 v-if="sidebarOpen">标签筛选</h3>
      <button class="toggle-btn" @click="toggleSidebar" :title="sidebarOpen ? '收起' : '展开'">
        {{ sidebarOpen ? '◀' : '▶' }}
      </button>
    </div>

    <div v-if="sidebarOpen" class="sidebar-content">
      <button class="new-article-btn" @click="createNewArticle">
        + 新建笔记
      </button>

      <div class="tags-section">
        <div v-if="tagsLoading" class="loading-state">
          <span class="loading-spinner"></span>
          加载中...
        </div>
        
        <div v-else-if="!sortedTags.length" class="empty-state">
          暂无标签
        </div>
        
        <div v-else class="tag-list">
          <button
            v-for="tag in sortedTags"
            :key="tag.id"
            class="tag-item"
            :class="{ active: selectedTagId === tag.id }"
            @click="handleTagClick(tag.id)"
          >
            <span class="tag-name">{{ tag.name }}</span>
            <span class="tag-count">{{ tag.articleCount || 0 }}</span>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="sidebar-collapsed">
      <button class="new-article-btn-mini" @click="createNewArticle" title="新建笔记">
        +
      </button>
    </div>
  </aside>
</template>

<style scoped>
.app-sidebar {
  width: 220px;
  background: var(--bai);
  border-right: 1px solid var(--hui);
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  flex-shrink: 0;
}

.app-sidebar.collapsed {
  width: 48px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--hui);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.toggle-btn {
  background: transparent;
  border: none;
  padding: 4px 8px;
  color: #666;
  cursor: pointer;
  font-size: 12px;
}

.toggle-btn:hover {
  background: var(--danhui);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.sidebar-collapsed {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
}

.new-article-btn {
  width: 100%;
  padding: 10px 16px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 16px;
}

.new-article-btn:hover {
  background: var(--primary-hover);
}

.new-article-btn-mini {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  border: none;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.new-article-btn-mini:hover {
  background: var(--primary-hover);
}

.tags-section {
  flex: 1;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 13px;
}

.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid var(--hui);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.tag-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tag-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.tag-item:hover {
  background: var(--danhui);
}

.tag-item.active {
  background: rgba(74, 144, 217, 0.1);
  color: var(--primary);
}

.tag-name {
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-item.active .tag-name {
  color: var(--primary);
  font-weight: 500;
}

.tag-count {
  font-size: 11px;
  color: #999;
  background: var(--danhui);
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.tag-item.active .tag-count {
  background: var(--primary);
  color: white;
}

@media (max-width: 768px) {
  .app-sidebar {
    position: fixed;
    left: 0;
    top: 56px;
    bottom: 0;
    z-index: 100;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  }
  
  .app-sidebar.collapsed {
    transform: translateX(-100%);
  }
}
</style>
