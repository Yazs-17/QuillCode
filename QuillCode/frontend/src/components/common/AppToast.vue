<script setup>
import { computed } from 'vue'
import { useUiStore } from '../../stores/ui'

const uiStore = useUiStore()

const toast = computed(() => uiStore.toast)

// Use CSS classes for icons instead of emoji/symbols
const iconClass = computed(() => {
  const classMap = {
    success: 'toast-icon-success',
    error: 'toast-icon-error',
    warning: 'toast-icon-warning',
    info: 'toast-icon-info'
  }
  return classMap[toast.value?.type] || classMap.info
})
</script>

<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="toast" class="toast-container">
        <div :class="['toast', `toast-${toast.type}`]">
          <span class="toast-icon" :class="iconClass"></span>
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
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  position: relative;
}

/* Success checkmark icon */
.toast-icon-success::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 6px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* Error X icon */
.toast-icon-error::before,
.toast-icon-error::after {
  content: '';
  position: absolute;
  left: 7px;
  top: 2px;
  width: 2px;
  height: 12px;
  background: white;
}
.toast-icon-error::before {
  transform: rotate(45deg);
}
.toast-icon-error::after {
  transform: rotate(-45deg);
}

/* Warning triangle icon */
.toast-icon-warning::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 3px;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 10px solid #333;
}
.toast-icon-warning::after {
  content: '!';
  position: absolute;
  left: 6px;
  top: 6px;
  font-size: 8px;
  font-weight: bold;
  color: #ffc107;
}

/* Info icon */
.toast-icon-info::before {
  content: 'i';
  position: absolute;
  left: 5px;
  top: 1px;
  font-size: 12px;
  font-weight: bold;
  font-style: italic;
  font-family: serif;
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

.toast-warning .toast-icon-warning::after {
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
