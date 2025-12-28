<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    default: 'empty'
  },
  title: {
    type: String,
    default: '暂无数据'
  },
  description: {
    type: String,
    default: ''
  },
  actionText: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['action'])

// Map icon names to CSS classes
const iconClass = computed(() => {
  const iconMap = {
    'empty': 'icon-empty',
    'document': 'icon-document',
    'search': 'icon-search',
    'link': 'icon-link',
    'tag': 'icon-tag',
    'error': 'icon-error',
    'comment': 'icon-comment'
  }
  return iconMap[props.icon] || 'icon-empty'
})

function handleAction() {
  emit('action')
}
</script>

<template>
  <div class="empty-state">
    <span class="empty-icon css-icon" :class="iconClass"></span>
    <h3 class="empty-title">{{ title }}</h3>
    <p v-if="description" class="empty-description">{{ description }}</p>
    <button v-if="actionText" class="empty-action" @click="handleAction">
      {{ actionText }}
    </button>
    <slot></slot>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #999;
}

.empty-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.empty-description {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: #666;
  max-width: 300px;
}

.empty-action {
  padding: 10px 24px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.empty-action:hover {
  background: var(--primary-hover);
}
</style>
