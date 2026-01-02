<script setup>
defineProps({
  text: {
    type: String,
    default: '加载中...'
  },
  size: {
    type: String,
    default: 'medium',
    validator: (v) => ['small', 'medium', 'large'].includes(v)
  }
})
</script>

<template>
  <div class="loading-state" :class="size">
    <div class="spinner"></div>
    <span v-if="text" class="loading-text">{{ text }}</span>
  </div>
</template>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #666;
}

.loading-state.small {
  padding: 20px;
}

.loading-state.small .spinner {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.loading-state.small .loading-text {
  font-size: 12px;
}

.loading-state.large {
  padding: 60px 20px;
}

.loading-state.large .spinner {
  width: 40px;
  height: 40px;
  border-width: 4px;
}

.loading-state.large .loading-text {
  font-size: 16px;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--hui);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 14px;
}
</style>
