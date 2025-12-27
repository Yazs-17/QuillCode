<template>
  <div class="split-pane" :class="{ 'is-resizing': isResizing }">
    <div 
      class="split-pane-left" 
      :style="{ width: leftWidth + '%' }"
    >
      <slot name="left"></slot>
    </div>
    
    <div 
      class="split-pane-resizer"
      @mousedown="startResize"
    >
      <div class="resizer-handle"></div>
    </div>
    
    <div 
      class="split-pane-right"
      :style="{ width: (100 - leftWidth) + '%' }"
    >
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

const props = defineProps({
  initialLeftWidth: {
    type: Number,
    default: 50
  },
  minLeftWidth: {
    type: Number,
    default: 20
  },
  maxLeftWidth: {
    type: Number,
    default: 80
  }
})

const emit = defineEmits(['resize'])

const leftWidth = ref(props.initialLeftWidth)
const isResizing = ref(false)

function startResize(e) {
  e.preventDefault()
  isResizing.value = true
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function handleResize(e) {
  if (!isResizing.value) return
  
  const container = e.target.closest('.split-pane') || document.querySelector('.split-pane')
  if (!container) return
  
  const containerRect = container.getBoundingClientRect()
  const percentage = ((e.clientX - containerRect.left) / containerRect.width) * 100
  
  leftWidth.value = Math.min(Math.max(percentage, props.minLeftWidth), props.maxLeftWidth)
  emit('resize', leftWidth.value)
}

function stopResize() {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

function setLeftWidth(width) {
  leftWidth.value = Math.min(Math.max(width, props.minLeftWidth), props.maxLeftWidth)
}

defineExpose({
  setLeftWidth,
  leftWidth
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.split-pane {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.split-pane.is-resizing {
  cursor: col-resize;
}

.split-pane-left,
.split-pane-right {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.split-pane-resizer {
  width: 6px;
  background: var(--hui, #e0e0e0);
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
}

.split-pane-resizer:hover {
  background: var(--primary, #1890ff);
}

.resizer-handle {
  width: 2px;
  height: 30px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 1px;
}

.split-pane-resizer:hover .resizer-handle {
  background: rgba(255, 255, 255, 0.5);
}
</style>
