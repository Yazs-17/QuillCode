<template>
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="ai-key-dialog">
      <div class="dialog-header">
        <h3>需要配置 API Key</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="dialog-body">
        <div class="key-icon">🔑</div>
        
        <p class="dialog-message">
          使用 AI 功能需要先配置您的 API Key
        </p>

        <p class="dialog-description">
          在线试用版采用 BYOK (Bring Your Own Key) 模式，您需要提供自己的 OpenAI 或其他兼容服务的 API Key。
        </p>

        <div class="options-section">
          <div class="option-card" @click="$emit('configure')">
            <div class="option-icon">⚙️</div>
            <div class="option-content">
              <div class="option-title">配置 API Key</div>
              <div class="option-desc">使用您自己的 OpenAI/DeepSeek API Key</div>
            </div>
            <div class="option-arrow">→</div>
          </div>

          <div class="option-card" @click="handleDownload">
            <div class="option-icon">💻</div>
            <div class="option-content">
              <div class="option-title">下载完整版</div>
              <div class="option-desc">使用本地 Ollama 模型，无需 API Key</div>
            </div>
            <div class="option-arrow">→</div>
          </div>
        </div>

        <div class="info-box">
          <div class="info-icon">ℹ️</div>
          <div class="info-text">
            您的 API Key 仅存储在本地浏览器中，不会上传到任何服务器。
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="cancel-btn" @click="$emit('close')">稍后配置</button>
      </div>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['close', 'configure', 'download'])

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

.ai-key-dialog {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 480px;
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

.key-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 16px;
}

.dialog-message {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
}

.dialog-description {
  margin: 0 0 24px 0;
  color: #666;
  font-size: 14px;
  text-align: center;
  line-height: 1.5;
}

.options-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.option-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid var(--hui);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-card:hover {
  border-color: var(--primary);
  background: rgba(74, 144, 217, 0.05);
}

.option-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.option-content {
  flex: 1;
}

.option-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.option-desc {
  font-size: 13px;
  color: #999;
}

.option-arrow {
  font-size: 18px;
  color: #999;
  flex-shrink: 0;
}

.info-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #bae6fd;
}

.info-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.info-text {
  font-size: 13px;
  color: #0369a1;
  line-height: 1.4;
}

.dialog-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--hui);
  display: flex;
  justify-content: center;
}

.cancel-btn {
  padding: 10px 24px;
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
</style>
