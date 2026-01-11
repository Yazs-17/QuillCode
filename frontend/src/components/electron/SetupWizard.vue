<template>
  <div class="setup-wizard-overlay" v-if="visible">
    <div class="setup-wizard">
      <div class="wizard-header">
        <h1>欢迎使用 QuillCode</h1>
        <p class="subtitle">让我们完成一些初始设置</p>
      </div>

      <div class="wizard-progress">
        <div 
          v-for="(step, index) in steps" 
          :key="index"
          class="progress-step"
          :class="{ active: currentStep === index, completed: currentStep > index }"
        >
          <div class="step-indicator">{{ index + 1 }}</div>
          <span class="step-label">{{ step.title }}</span>
        </div>
      </div>

      <div class="wizard-content">
        <!-- Step 1: Welcome -->
        <div v-if="currentStep === 0" class="step-content">
          <div class="welcome-icon">📝</div>
          <h2>欢迎使用 QuillCode 桌面版</h2>
          <p>QuillCode 是一款轻量级的笔记和代码编辑器，支持 Markdown 编辑、代码高亮和 AI 辅助功能。</p>
          <div class="feature-list">
            <div class="feature-item">
              <span class="feature-icon">💾</span>
              <span>本地数据存储，隐私安全</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🔍</span>
              <span>强大的全文搜索功能</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🤖</span>
              <span>可选的 AI 辅助功能</span>
            </div>
          </div>
        </div>

        <!-- Step 2: Data Storage Path -->
        <div v-if="currentStep === 1" class="step-content">
          <h2>选择数据存储位置</h2>
          <p>请选择您希望存储笔记数据的目录。您可以使用默认位置，或选择自定义目录。</p>
          
          <div class="path-selector">
            <div class="path-input-group">
              <input 
                type="text" 
                v-model="config.dataPath" 
                readonly 
                class="path-input"
                placeholder="选择数据存储目录"
              />
              <button @click="selectDataPath" class="browse-btn">浏览...</button>
            </div>
            <button @click="useDefaultPath" class="default-btn">使用默认位置</button>
          </div>

          <div class="path-info">
            <p class="info-text">
              <span class="info-icon">ℹ️</span>
              数据将存储在此目录中，包括您的笔记、标签和设置。
            </p>
          </div>
        </div>

        <!-- Step 3: AI Configuration -->
        <div v-if="currentStep === 2" class="step-content">
          <h2>配置 AI 功能</h2>
          <p>选择您希望使用的 AI 服务模式。您可以稍后在设置中更改此配置。</p>

          <div class="ai-options">
            <div 
              class="ai-option"
              :class="{ selected: config.aiMode === 'ollama' }"
              @click="config.aiMode = 'ollama'"
            >
              <div class="option-header">
                <span class="option-icon">🦙</span>
                <span class="option-title">本地 Ollama</span>
                <span class="option-badge recommended">推荐</span>
              </div>
              <p class="option-desc">使用本地运行的 Ollama 服务，完全离线，隐私安全。</p>
              
              <div v-if="config.aiMode === 'ollama'" class="option-config">
                <label>Ollama 服务地址</label>
                <input 
                  type="text" 
                  v-model="config.ollamaEndpoint" 
                  placeholder="http://localhost:11434"
                />
              </div>
            </div>

            <div 
              class="ai-option"
              :class="{ selected: config.aiMode === 'byok' }"
              @click="config.aiMode = 'byok'"
            >
              <div class="option-header">
                <span class="option-icon">🔑</span>
                <span class="option-title">自带 API Key (BYOK)</span>
              </div>
              <p class="option-desc">使用您自己的 OpenAI 或兼容 API 的密钥。</p>
              
              <div v-if="config.aiMode === 'byok'" class="option-config">
                <label>API 端点</label>
                <input 
                  type="text" 
                  v-model="config.apiEndpoint" 
                  placeholder="https://api.openai.com/v1/chat/completions"
                />
                <label>API Key</label>
                <input 
                  type="password" 
                  v-model="config.apiKey" 
                  placeholder="sk-..."
                />
                <label>模型名称</label>
                <input 
                  type="text" 
                  v-model="config.model" 
                  placeholder="gpt-3.5-turbo"
                />
              </div>
            </div>

            <div 
              class="ai-option"
              :class="{ selected: config.aiMode === 'disabled' }"
              @click="config.aiMode = 'disabled'"
            >
              <div class="option-header">
                <span class="option-icon">🚫</span>
                <span class="option-title">暂不使用 AI</span>
              </div>
              <p class="option-desc">跳过 AI 配置，您可以稍后在设置中启用。</p>
            </div>
          </div>
        </div>

        <!-- Step 4: Complete -->
        <div v-if="currentStep === 3" class="step-content">
          <div class="complete-icon">✅</div>
          <h2>设置完成！</h2>
          <p>您的 QuillCode 已准备就绪。</p>
          
          <div class="config-summary">
            <h3>配置摘要</h3>
            <div class="summary-item">
              <span class="summary-label">数据存储位置:</span>
              <span class="summary-value">{{ config.dataPath }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">AI 模式:</span>
              <span class="summary-value">{{ aiModeLabel }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="wizard-footer">
        <button 
          v-if="currentStep > 0" 
          @click="prevStep" 
          class="btn btn-secondary"
        >
          上一步
        </button>
        <div class="spacer"></div>
        <button 
          v-if="currentStep < steps.length - 1" 
          @click="nextStep" 
          class="btn btn-primary"
          :disabled="!canProceed"
        >
          下一步
        </button>
        <button 
          v-if="currentStep === steps.length - 1" 
          @click="completeSetup" 
          class="btn btn-primary"
        >
          开始使用
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const emit = defineEmits(['complete']);

const visible = ref(false);
const currentStep = ref(0);

const steps = [
  { title: '欢迎' },
  { title: '存储位置' },
  { title: 'AI 配置' },
  { title: '完成' }
];

const config = ref({
  dataPath: '',
  aiMode: 'ollama',
  ollamaEndpoint: 'http://localhost:11434',
  apiKey: '',
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-3.5-turbo'
});

const aiModeLabel = computed(() => {
  switch (config.value.aiMode) {
    case 'ollama': return '本地 Ollama';
    case 'byok': return '自带 API Key';
    case 'disabled': return '未启用';
    default: return '未知';
  }
});

const canProceed = computed(() => {
  if (currentStep.value === 1) {
    return config.value.dataPath && config.value.dataPath.length > 0;
  }
  return true;
});

onMounted(async () => {
  if (window.electronAPI) {
    const isFirstRun = await window.electronAPI.isFirstRun();
    if (isFirstRun) {
      visible.value = true;
      await loadDefaultConfig();
    }
  }
});

async function loadDefaultConfig() {
  if (window.electronAPI) {
    const savedConfig = await window.electronAPI.getConfig();
    config.value = { ...config.value, ...savedConfig };
  }
}

async function selectDataPath() {
  if (window.electronAPI) {
    const path = await window.electronAPI.selectDirectory();
    if (path) {
      config.value.dataPath = path;
    }
  }
}

async function useDefaultPath() {
  if (window.electronAPI) {
    const paths = await window.electronAPI.getPaths();
    config.value.dataPath = `${paths.userData}/data`;
  }
}

function nextStep() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++;
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
}

async function completeSetup() {
  if (window.electronAPI) {
    await window.electronAPI.saveConfig(config.value);
    await window.electronAPI.completeFirstRun();
  }
  visible.value = false;
  emit('complete', config.value);
}

// Expose method to show wizard programmatically
function show() {
  visible.value = true;
  currentStep.value = 0;
}

defineExpose({ show });
</script>

<style scoped>
.setup-wizard-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.setup-wizard {
  background: #1e1e1e;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.wizard-header {
  padding: 24px 32px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  text-align: center;
}

.wizard-header h1 {
  margin: 0;
  color: white;
  font-size: 24px;
  font-weight: 600;
}

.wizard-header .subtitle {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.wizard-progress {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  background: #252525;
  border-bottom: 1px solid #333;
}

.progress-step {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.5;
  transition: opacity 0.3s;
}

.progress-step.active,
.progress-step.completed {
  opacity: 1;
}

.step-indicator {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #333;
  color: #888;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.progress-step.active .step-indicator {
  background: #3b82f6;
  color: white;
}

.progress-step.completed .step-indicator {
  background: #22c55e;
  color: white;
}

.step-label {
  font-size: 12px;
  color: #888;
  display: none;
}

@media (min-width: 500px) {
  .step-label {
    display: inline;
  }
}

.wizard-content {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

.step-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.step-content h2 {
  margin: 0 0 12px;
  color: #fff;
  font-size: 20px;
}

.step-content p {
  color: #aaa;
  line-height: 1.6;
  margin: 0 0 20px;
}

.welcome-icon,
.complete-icon {
  font-size: 64px;
  text-align: center;
  margin-bottom: 16px;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #252525;
  border-radius: 8px;
}

.feature-icon {
  font-size: 24px;
}

.feature-item span:last-child {
  color: #ddd;
}

.path-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.path-input-group {
  display: flex;
  gap: 8px;
}

.path-input {
  flex: 1;
  padding: 12px 16px;
  background: #252525;
  border: 1px solid #333;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
}

.browse-btn {
  padding: 12px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.browse-btn:hover {
  background: #2563eb;
}

.default-btn {
  padding: 10px 16px;
  background: transparent;
  color: #3b82f6;
  border: 1px solid #3b82f6;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.default-btn:hover {
  background: rgba(59, 130, 246, 0.1);
}

.path-info {
  margin-top: 16px;
}

.info-text {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #888;
  font-size: 13px;
}

.info-icon {
  flex-shrink: 0;
}

.ai-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-option {
  padding: 16px;
  background: #252525;
  border: 2px solid #333;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.ai-option:hover {
  border-color: #444;
}

.ai-option.selected {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.option-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.option-icon {
  font-size: 20px;
}

.option-title {
  font-weight: 600;
  color: #fff;
}

.option-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.option-badge.recommended {
  background: #22c55e;
  color: white;
}

.option-desc {
  color: #888;
  font-size: 13px;
  margin: 0;
}

.option-config {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #333;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-config label {
  color: #aaa;
  font-size: 12px;
  margin-bottom: -8px;
}

.option-config input {
  padding: 10px 12px;
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
}

.option-config input:focus {
  outline: none;
  border-color: #3b82f6;
}

.config-summary {
  background: #252525;
  border-radius: 12px;
  padding: 20px;
  margin-top: 24px;
}

.config-summary h3 {
  margin: 0 0 16px;
  color: #fff;
  font-size: 16px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #333;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-label {
  color: #888;
}

.summary-value {
  color: #fff;
  font-weight: 500;
  word-break: break-all;
  text-align: right;
  max-width: 60%;
}

.wizard-footer {
  display: flex;
  align-items: center;
  padding: 20px 32px;
  background: #252525;
  border-top: 1px solid #333;
}

.spacer {
  flex: 1;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #333;
  color: #666;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  color: #aaa;
  border: 1px solid #444;
}

.btn-secondary:hover {
  background: #333;
  color: #fff;
}
</style>
