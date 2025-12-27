<script setup>
import { computed } from 'vue'
import { useUiStore } from '../../stores/ui'

const uiStore = useUiStore()

const toast = computed(() => uiStore.toast)

const iconMap = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ'
}

const icon = computed(() => iconMap[toast.value?.type] || iconMap.info)
</script>

<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="toast" class="toast-container">
        <div :class="['toast', `toast-${toast.type}`]">
          <span class="toast-icon">{{ icon }}</span>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
}

.toast {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  background: #333;
  color: white;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  max-width: 400px;
}

.toast-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
}

.toast-success {
  background: #28a745;
}

.toast-error {
  background: #dc3545;
}

.toast-warning {
  background: #ffc107;
  color: #333;
}

.toast-info {
  background: #4a90d9;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
