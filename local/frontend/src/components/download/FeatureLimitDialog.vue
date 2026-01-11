<template>
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="feature-limit-dialog">
      <div class="dialog-header">
        <h3>功能受限</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="dialog-body">
        <div class="limit-icon">🔒</div>
        
        <p class="dialog-message">
          <strong>{{ featureName }}</strong> 功能仅在完整版中可用。
        </p>

        <p class="dialog-description">
          {{ description || '下载 QuillCode 完整版以解锁此功能，享受更强大的本地体验。' }}
        </p>

        <div class="feature-comparison">
          <div class="comparison-item online">
            <div class="comparison-header">
              <span class="comparison-icon">🌐</span>
              <span class="comparison-title">在线试用版</span>
            </div>
            <ul class="comparison-list">
              <li><span class="status unavailable">✗</span> {{ featureName }}</li>
              <li><span class="status available">✓</span> 浏览器本地存储</li>
              <li><span class="status available">✓</span> 基础笔记功能</li>
              <li><span class="status available">✓</span> 数据导出</li>
            </ul>
          </div>
          <div class="comparison-item local">
            <div class="comparison-header">
              <span class="comparison-icon">💻</span>
              <span class="comparison-title">完整版</span>
              <span class="recommended-badge">推荐</span>
            </div>
            <ul class="comparison-list">
              <li><span class="status available">✓</span> {{ featureName }}</li>
              <li><span class="status available">✓</span> SQLite 本地数据库</li>
              <li><span class="status available">✓</span> Ollama 本地 AI</li>
              <li><span class="status available">✓</span> Docker 部署</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="cancel-btn" @click="$emit('close')">继续使用在线版</button>
        <button class="download-btn" @click="handleDownload">
          <span class="btn-icon">⬇</span>
          下载完整版
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  featureName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'download'])

// GitHub Releases URL
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

.feature-limit-dialog {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 560px;
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
}

.limit-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 16px;
}

.dialog-message {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 16px;
  text-align: center;
}

.dialog-description {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 14px;
  text-align: center;
}

.feature-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.comparison-item {
  border-radius: 8px;
  padding: 16px;
  border: 2px solid var(--hui);
}

.comparison-item.online {
  background: #f9fafb;
}

.comparison-item.local {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(22, 163, 74, 0.1) 100%);
  border-color: #22c55e;
}

.comparison-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.comparison-icon {
  font-size: 20px;
}

.comparison-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.recommended-badge {
  background: #22c55e;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.comparison-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.comparison-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
  color: #555;
}

.status {
  font-size: 12px;
  font-weight: bold;
}

.status.available {
  color: #22c55e;
}

.status.unavailable {
  color: #ef4444;
}

.dialog-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--hui);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn {
  padding: 10px 16px;
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

@media (max-width: 560px) {
  .feature-comparison {
    grid-template-columns: 1fr;
  }
}
</style>
