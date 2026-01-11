<template>
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="ai-settings-dialog">
      <div class="dialog-header">
        <h3>AI 设置</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="dialog-body">
        <!-- Mode Selection (only show in local environment) -->
        <div v-if="isLocalEnv" class="mode-selection">
          <label class="mode-label">AI 模式</label>
          <div class="mode-options">
            <button 
              class="mode-btn" 
              :class="{ active: selectedMode === 'ollama' }"
              @click="selectMode('ollama')"
            >
              <span class="mode-icon">🦙</span>
              <span class="mode-name">本地 Ollama</span>
              <span class="mode-status" :class="{ available: ollamaAvailable }">
                {{ ollamaAvailable ? '可用' : '未检测到' }}
              </span>
            </button>
            <button 
              class="mode-btn" 
              :class="{ active: selectedMode === 'byok' }"
              @click="selectMode('byok')"
            >
              <span class="mode-icon">🔑</span>
              <span class="mode-name">BYOK 模式</span>
              <span class="mode-desc">使用自己的 API Key</span>
            </button>
          </div>
        </div>

        <!-- Ollama Settings -->
        <div v-if="selectedMode === 'ollama'" class="settings-section">
          <p class="settings-description">
            连接本地 Ollama 服务进行 AI 推理。请确保 Ollama 已启动。
          </p>

          <div class="settings-form">
            <!-- Ollama Endpoint -->
            <div class="form-group">
              <label for="ollamaEndpoint">Ollama 地址</label>
              <input 
                id="ollamaEndpoint"
                type="url"
                v-model="ollamaConfig.endpoint"
                placeholder="http://localhost:11434/api/chat"
              />
              <span class="form-hint">默认: http://localhost:11434/api/chat</span>
            </div>

            <!-- Model Selection -->
            <div class="form-group">
              <label for="ollamaModel">模型</label>
              <div class="model-select-wrapper">
                <select 
                  v-if="availableModels.length > 0"
                  id="ollamaModel"
                  v-model="ollamaConfig.model"
                >
                  <option v-for="model in availableModels" :key="model" :value="model">
                    {{ model }}
                  </option>
                </select>
                <input 
                  v-else
                  id="ollamaModel"
                  type="text"
                  v-model="ollamaConfig.model"
                  placeholder="llama2"
                />
              </div>
              <span class="form-hint">
                {{ availableModels.length > 0 ? '已检测到的模型' : '输入模型名称，如: llama2, codellama, mistral' }}
              </span>
            </div>

            <!-- Reconnect Button -->
            <div class="reconnect-section">
              <button 
                class="reconnect-btn" 
                :disabled="reconnecting"
                @click="handleReconnect"
              >
                {{ reconnecting ? '检测中...' : '重新检测 Ollama' }}
              </button>
              <span v-if="reconnectResult" class="reconnect-result" :class="reconnectResult.type">
                {{ reconnectResult.message }}
              </span>
            </div>
          </div>
        </div>

        <!-- BYOK Settings -->
        <div v-if="selectedMode === 'byok'" class="settings-section">
          <p class="settings-description">
            配置您的 AI 服务，使用自己的 API Key 调用 OpenAI 兼容的 AI 服务。
          </p>

          <div class="settings-form">
            <!-- API Endpoint -->
            <div class="form-group">
              <label for="endpoint">API 端点</label>
              <select id="endpoint" v-model="selectedEndpoint" @change="handleEndpointChange">
                <option value="openai">OpenAI (api.openai.com)</option>
                <option value="deepseek">DeepSeek (api.deepseek.com)</option>
                <option value="custom">自定义端点</option>
              </select>
            </div>

            <!-- Custom Endpoint Input -->
            <div class="form-group" v-if="selectedEndpoint === 'custom'">
              <label for="customEndpoint">自定义端点 URL</label>
              <input 
                id="customEndpoint"
                type="url"
                v-model="byokConfig.endpoint"
                placeholder="https://api.example.com/v1/chat/completions"
              />
            </div>

            <!-- Model Selection -->
            <div class="form-group">
              <label for="model">模型</label>
              <input 
                id="model"
                type="text"
                v-model="byokConfig.model"
                placeholder="gpt-3.5-turbo"
              />
              <span class="form-hint">常用模型: gpt-3.5-turbo, gpt-4, deepseek-chat</span>
            </div>

            <!-- API Key -->
            <div class="form-group">
              <label for="apiKey">API Key</label>
              <div class="api-key-input">
                <input 
                  id="apiKey"
                  :type="showApiKey ? 'text' : 'password'"
                  v-model="byokConfig.apiKey"
                  placeholder="sk-..."
                />
                <button 
                  type="button" 
                  class="toggle-visibility-btn"
                  @click="showApiKey = !showApiKey"
                >
                  {{ showApiKey ? '🙈' : '👁' }}
                </button>
              </div>
              <span class="form-hint">您的 API Key 仅存储在本地浏览器中，不会上传到服务器</span>
            </div>
          </div>

          <!-- Test Connection -->
          <div class="test-section">
            <button 
              class="test-btn" 
              :disabled="!canTestBYOK || testing"
              @click="testBYOKConnection"
            >
              {{ testing ? '测试中...' : '测试连接' }}
            </button>
            <span v-if="testResult" class="test-result" :class="testResult.type">
              {{ testResult.message }}
            </span>
          </div>
        </div>

        <!-- Status Message -->
        <div v-if="statusMessage" class="status-message" :class="statusMessage.type">
          {{ statusMessage.text }}
        </div>
      </div>

      <div class="dialog-footer">
        <button class="cancel-btn" @click="$emit('close')">取消</button>
        <button 
          class="save-btn" 
          :disabled="!canSave || saving"
          @click="handleSave"
        >
          {{ saving ? '保存中...' : '保存设置' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAIService } from '../../composables/useAIService'
import { getBYOKAIService } from '../../ai/byokService'
import { getOllamaAIService } from '../../ai/ollamaService'

const emit = defineEmits(['close', 'saved'])

const { 
  isLocalEnv, 
  ollamaAvailable, 
  activeMode,
  getOllamaModels,
  reconnectOllama
} = useAIService()

// Predefined endpoints
const ENDPOINTS = {
  openai: 'https://api.openai.com/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/v1/chat/completions'
}

// Mode selection
const selectedMode = ref(activeMode.value || 'byok')

// BYOK config
const byokConfig = ref({
  endpoint: ENDPOINTS.openai,
  model: 'gpt-3.5-turbo',
  apiKey: ''
})

// Ollama config
const ollamaConfig = ref({
  endpoint: 'http://localhost:11434/api/chat',
  model: 'llama2'
})

const selectedEndpoint = ref('openai')
const showApiKey = ref(false)
const saving = ref(false)
const testing = ref(false)
const reconnecting = ref(false)
const statusMessage = ref(null)
const testResult = ref(null)
const reconnectResult = ref(null)
const availableModels = ref([])

// Computed
const canTestBYOK = computed(() => {
  return byokConfig.value.endpoint && byokConfig.value.model && byokConfig.value.apiKey
})

const canSave = computed(() => {
  if (selectedMode.value === 'ollama') {
    return ollamaConfig.value.endpoint && ollamaConfig.value.model
  }
  return byokConfig.value.endpoint && byokConfig.value.model
})

// Methods
function selectMode(mode) {
  selectedMode.value = mode
  testResult.value = null
  reconnectResult.value = null
}

function handleEndpointChange() {
  if (selectedEndpoint.value !== 'custom') {
    byokConfig.value.endpoint = ENDPOINTS[selectedEndpoint.value]
  }
}

async function loadConfig() {
  try {
    // Load BYOK config
    const byokService = await getBYOKAIService()
    const savedBYOKConfig = byokService.getConfig()
    
    if (savedBYOKConfig.endpoint) {
      byokConfig.value.endpoint = savedBYOKConfig.endpoint
      
      if (savedBYOKConfig.endpoint === ENDPOINTS.openai) {
        selectedEndpoint.value = 'openai'
      } else if (savedBYOKConfig.endpoint === ENDPOINTS.deepseek) {
        selectedEndpoint.value = 'deepseek'
      } else {
        selectedEndpoint.value = 'custom'
      }
    }
    
    if (savedBYOKConfig.model) {
      byokConfig.value.model = savedBYOKConfig.model
    }
    
    if (savedBYOKConfig.apiKey) {
      byokConfig.value.apiKey = savedBYOKConfig.apiKey
    }

    // Load Ollama config if in local environment
    if (isLocalEnv.value) {
      const ollamaService = await getOllamaAIService()
      const savedOllamaConfig = ollamaService.getConfig()
      
      if (savedOllamaConfig.endpoint) {
        ollamaConfig.value.endpoint = savedOllamaConfig.endpoint
      }
      
      if (savedOllamaConfig.model) {
        ollamaConfig.value.model = savedOllamaConfig.model
      }

      // Get available models
      availableModels.value = getOllamaModels()
    }

    // Set initial mode based on active mode
    selectedMode.value = activeMode.value || 'byok'
  } catch (err) {
    console.error('Failed to load AI config:', err)
  }
}

async function handleReconnect() {
  if (reconnecting.value) return
  
  reconnecting.value = true
  reconnectResult.value = null
  
  try {
    const success = await reconnectOllama()
    
    if (success) {
      availableModels.value = getOllamaModels()
      reconnectResult.value = {
        type: 'success',
        message: `✓ 已连接！检测到 ${availableModels.value.length} 个模型`
      }
      
      // Auto-select first model if current is not available
      if (availableModels.value.length > 0 && !availableModels.value.includes(ollamaConfig.value.model)) {
        ollamaConfig.value.model = availableModels.value[0]
      }
    } else {
      reconnectResult.value = {
        type: 'error',
        message: '✗ 未检测到 Ollama 服务，请确保已启动'
      }
    }
  } catch (err) {
    reconnectResult.value = {
      type: 'error',
      message: `✗ 连接失败: ${err.message}`
    }
  } finally {
    reconnecting.value = false
  }
}

async function testBYOKConnection() {
  if (!canTestBYOK.value || testing.value) return
  
  testing.value = true
  testResult.value = null
  
  try {
    const service = await getBYOKAIService()
    service.setConfig({
      mode: 'byok',
      endpoint: byokConfig.value.endpoint,
      model: byokConfig.value.model,
      apiKey: byokConfig.value.apiKey
    })
    
    const response = await service.chat([
      { role: 'user', content: 'Hello, please respond with "OK" to confirm the connection works.' }
    ])
    
    if (response) {
      testResult.value = {
        type: 'success',
        message: '✓ 连接成功！'
      }
    }
  } catch (err) {
    testResult.value = {
      type: 'error',
      message: `✗ 连接失败: ${err.message}`
    }
  } finally {
    testing.value = false
  }
}

async function handleSave() {
  if (!canSave.value || saving.value) return
  
  saving.value = true
  statusMessage.value = null
  
  try {
    if (selectedMode.value === 'ollama') {
      const service = await getOllamaAIService()
      service.setConfig({
        mode: 'ollama',
        endpoint: ollamaConfig.value.endpoint,
        model: ollamaConfig.value.model
      })
      await service.saveConfig()
    } else {
      const service = await getBYOKAIService()
      service.setConfig({
        mode: 'byok',
        endpoint: byokConfig.value.endpoint,
        model: byokConfig.value.model,
        apiKey: byokConfig.value.apiKey
      })
      await service.saveConfig()
    }
    
    statusMessage.value = {
      type: 'success',
      text: '设置已保存'
    }
    
    emit('saved', selectedMode.value === 'ollama' ? ollamaConfig.value : byokConfig.value)
    
    setTimeout(() => {
      emit('close')
    }, 1500)
  } catch (err) {
    statusMessage.value = {
      type: 'error',
      text: '保存失败: ' + (err.message || '未知错误')
    }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadConfig()
})
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

.ai-settings-dialog {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
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
  padding: 20px;
}

/* Mode Selection */
.mode-selection {
  margin-bottom: 20px;
}

.mode-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
}

.mode-options {
  display: flex;
  gap: 12px;
}

.mode-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  background: var(--danhui);
  border: 2px solid var(--hui);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn:hover {
  border-color: var(--primary);
}

.mode-btn.active {
  border-color: var(--primary);
  background: rgba(59, 130, 246, 0.1);
}

.mode-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.mode-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.mode-status,
.mode-desc {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.mode-status.available {
  color: #22c55e;
}

/* Settings Section */
.settings-section {
  border-top: 1px solid var(--hui);
  padding-top: 16px;
}

.settings-description {
  margin: 0 0 16px 0;
  color: #666;
  font-size: 14px;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select {
  padding: 10px 12px;
  border: 1px solid var(--hui);
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary);
}

.form-hint {
  font-size: 12px;
  color: #999;
}

.model-select-wrapper select,
.model-select-wrapper input {
  width: 100%;
}

.api-key-input {
  display: flex;
  gap: 8px;
}

.api-key-input input {
  flex: 1;
}

.toggle-visibility-btn {
  padding: 10px 12px;
  background: var(--danhui);
  border: 1px solid var(--hui);
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.toggle-visibility-btn:hover {
  background: #e5e5e5;
}

/* Reconnect Section */
.reconnect-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.reconnect-btn {
  padding: 8px 16px;
  background: var(--danhui);
  border: 1px solid var(--hui);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.reconnect-btn:hover:not(:disabled) {
  background: #e5e5e5;
}

.reconnect-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reconnect-result {
  font-size: 13px;
}

.reconnect-result.success {
  color: #22c55e;
}

.reconnect-result.error {
  color: #ef4444;
}

/* Status and Test */
.status-message {
  margin-top: 16px;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
}

.status-message.success {
  background: #d4edda;
  color: #155724;
}

.status-message.error {
  background: #f8d7da;
  color: #721c24;
}

.test-section {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.test-btn {
  padding: 8px 16px;
  background: var(--danhui);
  border: 1px solid var(--hui);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.test-btn:hover:not(:disabled) {
  background: #e5e5e5;
}

.test-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.test-result {
  font-size: 13px;
}

.test-result.success {
  color: #22c55e;
}

.test-result.error {
  color: #ef4444;
}

/* Footer */
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

.save-btn {
  padding: 10px 24px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.save-btn:hover:not(:disabled) {
  background: var(--primary-hover);
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
