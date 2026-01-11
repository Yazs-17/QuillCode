<template>
  <div class="code-preview">
    <div class="preview-header">
      <span class="preview-title">执行结果</span>
      <div class="preview-actions">
        <button 
          v-if="logs.length > 0" 
          class="clear-btn" 
          @click="clearLogs"
          title="清空"
        >
          清空
        </button>
      </div>
    </div>
    
    <div class="preview-content" ref="contentRef">
      <div v-if="isRunning" class="running-indicator">
        <span class="spinner"></span>
        <span>执行中...</span>
      </div>
      
      <div v-else-if="logs.length === 0" class="empty-state">
        <span>点击运行按钮执行代码</span>
      </div>
      
      <div v-else class="log-list">
        <div 
          v-for="(log, index) in logs" 
          :key="index"
          class="log-item"
          :class="'log-' + log.type"
        >
          <span class="log-type">{{ getLogTypeLabel(log.type) }}</span>
          <pre class="log-text">{{ log.text }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  logs: {
    type: Array,
    default: () => []
  },
  isRunning: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['clear'])

const contentRef = ref(null)

function getLogTypeLabel(type) {
  const labels = {
    log: 'LOG',
    info: 'INFO',
    warn: 'WARN',
    error: 'ERROR',
    result: 'RESULT',
    success: 'OK'
  }
  return labels[type] || type.toUpperCase()
}

function clearLogs() {
  emit('clear')
}

// Auto-scroll to bottom when new logs are added
watch(() => props.logs.length, () => {
  nextTick(() => {
    if (contentRef.value) {
      contentRef.value.scrollTop = contentRef.value.scrollHeight
    }
  })
})
</script>

<style scoped>
.code-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #252526;
  border-bottom: 1px solid #3c3c3c;
  flex-shrink: 0;
}

.preview-title {
  font-weight: 500;
  color: #cccccc;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.clear-btn {
  padding: 4px 8px;
  font-size: 12px;
  background: transparent;
  color: #888;
  border: 1px solid #555;
  border-radius: 3px;
  cursor: pointer;
}

.clear-btn:hover {
  background: #333;
  color: #ccc;
}

.preview-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.running-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #569cd6;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #569cd6;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  color: #666;
  font-style: italic;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.log-item {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #2d2d2d;
}

.log-item:last-child {
  border-bottom: none;
}

.log-type {
  flex-shrink: 0;
  width: 50px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.log-text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  flex: 1;
}

.log-log .log-type { color: #d4d4d4; }
.log-info .log-type { color: #569cd6; }
.log-warn .log-type { color: #ce9178; }
.log-error .log-type { color: #f14c4c; }
.log-result .log-type { color: #4ec9b0; }
.log-success .log-type { color: #6a9955; }

.log-error .log-text { color: #f14c4c; }
.log-warn .log-text { color: #ce9178; }
.log-result .log-text { color: #4ec9b0; }
.log-success .log-text { color: #6a9955; }
</style>
