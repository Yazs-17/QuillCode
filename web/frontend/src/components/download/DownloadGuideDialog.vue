<template>
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="download-dialog">
      <div class="dialog-header">
        <h3>{{ title }}</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="dialog-body">
        <div class="feature-icon">🚀</div>
        
        <p class="dialog-message">
          {{ message }}
        </p>

        <div class="feature-list" v-if="showFeatures">
          <div class="feature-item">
            <span class="feature-check">✓</span>
            <span>本地 SQLite 数据存储，无需云端</span>
          </div>
          <div class="feature-item">
            <span class="feature-check">✓</span>
            <span>集成 Ollama 本地 AI 推理</span>
          </div>
          <div class="feature-item">
            <span class="feature-check">✓</span>
            <span>完整的数据导入导出功能</span>
          </div>
          <div class="feature-item">
            <span class="feature-check">✓</span>
            <span>Docker 一键部署</span>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="cancel-btn" @click="$emit('close')">稍后再说</button>
        <button class="download-btn" @click="handleDownload">
          <span class="btn-icon">⬇</span>
          前往下载
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '下载完整版'
  },
  message: {
    type: String,
    default: '下载 QuillCode 完整版，享受更强大的功能和更好的体验。'
  },
  showFeatures: {
    type: Boolean,
    default: true
  },
  featureName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'download'])

// GitHub Releases URL - can be configured via environment variable
const GITHUB_RELEASES_URL = 'https://github.com/quillcode/quillcode/releases'

function handleDownload() {
  window.open(GITHUB_RELEASES_URL, '_blank')
  emit('download')
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.download-dialog {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--hui);
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.dialog-body {
  padding: 24px 20px;
  text-align: center;
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.dialog-message {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 15px;
  line-height: 1.6;
}

.feature-list {
  text-align: left;
  background: var(--danhui);
  border-radius: 8px;
  padding: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 14px;
  color: #444;
}

.feature-item:not(:last-child) {
  border-bottom: 1px solid var(--hui);
}

.feature-check {
  color: #22c55e;
  font-weight: bold;
  flex-shrink: 0;
}

.dialog-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--hui);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn {
  padding: 10px 20px;
  background: transparent;
  color: #666;
  border: 1px solid var(--hui);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: var(--danhui);
  border-color: #bbb;
}

.download-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.download-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

.btn-icon {
  font-size: 16px;
}
</style>
