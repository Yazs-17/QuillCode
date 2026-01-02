<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useTagStore } from '../../stores/tag'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'

const props = defineProps({
  showSidebar: {
    type: Boolean,
    default: true
  },
  showNav: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['tagSelect'])

const selectedTag = defineModel('selectedTag', { default: null })

const authStore = useAuthStore()
const tagStore = useTagStore()

function handleTagSelect(tagId) {
  emit('tagSelect', tagId)
}

onMounted(() => {
  authStore.init()
  if (authStore.isAuthenticated) {
    tagStore.fetchTags()
  }
})
</script>

<template>
  <div class="app-layout">
    <AppHeader :show-nav="showNav" />
    
    <div class="app-body">
      <AppSidebar 
        v-if="showSidebar && authStore.isAuthenticated"
        v-model:selectedTag="selectedTag"
        @tag-select="handleTagSelect"
      />
      
      <main class="app-main">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--danhui);
}

.app-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  min-width: 0;
}
</style>
