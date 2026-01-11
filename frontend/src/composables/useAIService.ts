/**
 * AI Service Composable
 * 
 * Provides reactive state and methods for managing AI service configuration
 * and interactions throughout the application.
 * 
 * Supports automatic fallback from Ollama to BYOK mode when Ollama is unavailable.
 * 
 * @module composables/useAIService
 */

import { ref, computed, readonly } from 'vue'
import { getBYOKAIService, BYOKAIService } from '../ai/byokService'
import { getOllamaAIService, OllamaAIService } from '../ai/ollamaService'
import type { AIConfig, ChatMessage, AIService } from '../ai/types'
import { AIServiceError, AIErrorCode, DISABLED_CONFIG } from '../ai/types'
import { EnvironmentDetector, RuntimeEnvironment } from '../utils/environment'

// ============================================================================
// State
// ============================================================================

const isInitialized = ref(false)
const isAvailable = ref(false)
const isLoading = ref(false)
const currentConfig = ref<AIConfig | null>(null)
const showSettingsDialog = ref(false)
const showKeyRequiredDialog = ref(false)
const activeMode = ref<'ollama' | 'byok' | 'disabled'>('disabled')
const ollamaAvailable = ref(false)

let byokService: BYOKAIService | null = null
let ollamaService: OllamaAIService | null = null

// ============================================================================
// Environment Detection
// ============================================================================

/**
 * Check if we're in a local environment that supports Ollama
 */
function isLocalEnvironment(): boolean {
  const env = EnvironmentDetector.detect()
  return env === RuntimeEnvironment.ELECTRON || 
         env === RuntimeEnvironment.DOCKER ||
         env === RuntimeEnvironment.BROWSER_LOCAL
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize the AI service with automatic fallback logic
 * 
 * Priority:
 * 1. In local environment: Try Ollama first, fallback to BYOK
 * 2. In online environment: Use BYOK only
 */
async function initialize(): Promise<void> {
  if (isInitialized.value) return
  
  isLoading.value = true
  
  try {
    // Always initialize BYOK service as fallback
    byokService = await getBYOKAIService()
    
    // In local environment, try Ollama first
    if (isLocalEnvironment()) {
      ollamaService = await getOllamaAIService()
      const ollamaIsAvailable = await ollamaService.isAvailable()
      ollamaAvailable.value = ollamaIsAvailable
      
      if (ollamaIsAvailable) {
        // Ollama is available, use it as primary
        activeMode.value = 'ollama'
        currentConfig.value = ollamaService.getConfig()
        isAvailable.value = true
      } else {
        // Ollama not available, fallback to BYOK
        await fallbackToBYOK()
      }
    } else {
      // Online environment, use BYOK only
      activeMode.value = 'byok'
      currentConfig.value = byokService.getConfig()
      isAvailable.value = await byokService.isAvailable()
    }
    
    isInitialized.value = true
  } catch (error) {
    console.error('Failed to initialize AI service:', error)
    isAvailable.value = false
    activeMode.value = 'disabled'
  } finally {
    isLoading.value = false
  }
}

/**
 * Fallback to BYOK mode when Ollama is unavailable
 */
async function fallbackToBYOK(): Promise<void> {
  if (!byokService) {
    byokService = await getBYOKAIService()
  }
  
  activeMode.value = 'byok'
  currentConfig.value = byokService.getConfig()
  isAvailable.value = await byokService.isAvailable()
}

/**
 * Attempt to reconnect to Ollama service
 */
async function reconnectOllama(): Promise<boolean> {
  if (!isLocalEnvironment()) return false
  
  isLoading.value = true
  
  try {
    if (!ollamaService) {
      ollamaService = await getOllamaAIService()
    }
    
    const isRunning = await ollamaService.detectService()
    ollamaAvailable.value = isRunning
    
    if (isRunning) {
      activeMode.value = 'ollama'
      currentConfig.value = ollamaService.getConfig()
      isAvailable.value = true
      return true
    }
    
    return false
  } catch {
    return false
  } finally {
    isLoading.value = false
  }
}

// ============================================================================
// Service Selection
// ============================================================================

/**
 * Get the currently active AI service
 */
function getActiveService(): AIService | null {
  switch (activeMode.value) {
    case 'ollama':
      return ollamaService
    case 'byok':
      return byokService
    default:
      return null
  }
}

/**
 * Switch to a specific AI mode
 */
async function switchMode(mode: 'ollama' | 'byok' | 'disabled'): Promise<void> {
  if (mode === 'ollama') {
    if (!isLocalEnvironment()) {
      throw new AIServiceError(
        'Ollama 仅在本地版本中可用',
        AIErrorCode.SERVICE_UNAVAILABLE
      )
    }
    
    if (!ollamaService) {
      ollamaService = await getOllamaAIService()
    }
    
    const isRunning = await ollamaService.detectService()
    if (!isRunning) {
      throw new AIServiceError(
        'Ollama 服务未运行，请启动 Ollama 后重试',
        AIErrorCode.OLLAMA_NOT_RUNNING
      )
    }
    
    activeMode.value = 'ollama'
    currentConfig.value = ollamaService.getConfig()
    isAvailable.value = true
    ollamaAvailable.value = true
  } else if (mode === 'byok') {
    if (!byokService) {
      byokService = await getBYOKAIService()
    }
    
    activeMode.value = 'byok'
    currentConfig.value = byokService.getConfig()
    isAvailable.value = await byokService.isAvailable()
  } else {
    activeMode.value = 'disabled'
    currentConfig.value = DISABLED_CONFIG
    isAvailable.value = false
  }
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Update AI configuration for the active service
 */
async function updateConfig(config: Partial<AIConfig>): Promise<void> {
  if (!isInitialized.value) {
    await initialize()
  }
  
  const service = getActiveService()
  if (service) {
    service.setConfig(config)
    
    // Save config based on active mode
    if (activeMode.value === 'byok' && byokService) {
      await byokService.saveConfig()
    } else if (activeMode.value === 'ollama' && ollamaService) {
      await ollamaService.saveConfig()
    }
    
    currentConfig.value = service.getConfig()
    isAvailable.value = await service.isAvailable()
  }
}

/**
 * Clear the stored API key (BYOK mode only)
 */
async function clearApiKey(): Promise<void> {
  if (byokService) {
    await byokService.clearApiKey()
    if (activeMode.value === 'byok') {
      currentConfig.value = byokService.getConfig()
      isAvailable.value = false
    }
  }
}

// ============================================================================
// Chat Methods
// ============================================================================

/**
 * Send a chat message and get a response
 * Automatically handles fallback when Ollama fails
 */
async function chat(messages: ChatMessage[]): Promise<string> {
  if (!isInitialized.value) {
    await initialize()
  }
  
  const service = getActiveService()
  
  if (!service) {
    showKeyRequiredDialog.value = true
    throw new AIServiceError(
      'AI 服务未配置',
      AIErrorCode.SERVICE_UNAVAILABLE
    )
  }
  
  // Check availability
  const available = await service.isAvailable()
  if (!available) {
    // If Ollama mode and not available, try fallback
    if (activeMode.value === 'ollama') {
      console.warn('Ollama not available, attempting fallback to BYOK')
      await fallbackToBYOK()
      
      if (byokService && await byokService.isAvailable()) {
        return byokService.chat(messages)
      }
    }
    
    showKeyRequiredDialog.value = true
    throw new AIServiceError(
      '请先配置 API Key',
      AIErrorCode.API_KEY_MISSING
    )
  }
  
  try {
    return await service.chat(messages)
  } catch (error) {
    // If Ollama fails, try fallback to BYOK
    if (activeMode.value === 'ollama' && error instanceof AIServiceError) {
      if (error.code === AIErrorCode.OLLAMA_NOT_RUNNING || 
          error.code === AIErrorCode.SERVICE_UNAVAILABLE) {
        console.warn('Ollama request failed, attempting fallback to BYOK')
        ollamaAvailable.value = false
        await fallbackToBYOK()
        
        if (byokService && await byokService.isAvailable()) {
          return byokService.chat(messages)
        }
      }
    }
    throw error
  }
}

/**
 * Send a streaming chat message
 * Automatically handles fallback when Ollama fails
 */
async function streamChat(
  messages: ChatMessage[],
  onChunk: (chunk: string) => void
): Promise<void> {
  if (!isInitialized.value) {
    await initialize()
  }
  
  const service = getActiveService()
  
  if (!service) {
    showKeyRequiredDialog.value = true
    throw new AIServiceError(
      'AI 服务未配置',
      AIErrorCode.SERVICE_UNAVAILABLE
    )
  }
  
  // Check availability
  const available = await service.isAvailable()
  if (!available) {
    // If Ollama mode and not available, try fallback
    if (activeMode.value === 'ollama') {
      console.warn('Ollama not available, attempting fallback to BYOK')
      await fallbackToBYOK()
      
      if (byokService && await byokService.isAvailable()) {
        return byokService.stream(messages, onChunk)
      }
    }
    
    showKeyRequiredDialog.value = true
    throw new AIServiceError(
      '请先配置 API Key',
      AIErrorCode.API_KEY_MISSING
    )
  }
  
  try {
    return await service.stream(messages, onChunk)
  } catch (error) {
    // If Ollama fails, try fallback to BYOK
    if (activeMode.value === 'ollama' && error instanceof AIServiceError) {
      if (error.code === AIErrorCode.OLLAMA_NOT_RUNNING || 
          error.code === AIErrorCode.SERVICE_UNAVAILABLE) {
        console.warn('Ollama stream failed, attempting fallback to BYOK')
        ollamaAvailable.value = false
        await fallbackToBYOK()
        
        if (byokService && await byokService.isAvailable()) {
          return byokService.stream(messages, onChunk)
        }
      }
    }
    throw error
  }
}

// ============================================================================
// Dialog Control
// ============================================================================

/**
 * Open the AI settings dialog
 */
function openSettings(): void {
  showSettingsDialog.value = true
}

/**
 * Close the AI settings dialog
 */
function closeSettings(): void {
  showSettingsDialog.value = false
}

/**
 * Close the key required dialog
 */
function closeKeyRequired(): void {
  showKeyRequiredDialog.value = false
}

/**
 * Handle configure action from key required dialog
 */
function handleConfigure(): void {
  showKeyRequiredDialog.value = false
  showSettingsDialog.value = true
}

// ============================================================================
// Ollama-specific Methods
// ============================================================================

/**
 * Get available Ollama models
 */
function getOllamaModels(): string[] {
  return ollamaService?.getAvailableModels() || []
}

// ============================================================================
// Composable Export
// ============================================================================

/**
 * Use AI Service composable
 * 
 * Provides reactive state and methods for AI service management
 * with automatic fallback from Ollama to BYOK mode.
 */
export function useAIService() {
  return {
    // State (readonly)
    isInitialized: readonly(isInitialized),
    isAvailable: readonly(isAvailable),
    isLoading: readonly(isLoading),
    currentConfig: readonly(currentConfig),
    activeMode: readonly(activeMode),
    ollamaAvailable: readonly(ollamaAvailable),
    showSettingsDialog,
    showKeyRequiredDialog,
    
    // Computed
    hasApiKey: computed(() => !!currentConfig.value?.apiKey),
    isOllamaMode: computed(() => activeMode.value === 'ollama'),
    isBYOKMode: computed(() => activeMode.value === 'byok'),
    isDisabled: computed(() => activeMode.value === 'disabled'),
    isLocalEnv: computed(() => isLocalEnvironment()),
    
    // Methods
    initialize,
    updateConfig,
    clearApiKey,
    chat,
    streamChat,
    
    // Mode switching
    switchMode,
    reconnectOllama,
    fallbackToBYOK,
    
    // Ollama-specific
    getOllamaModels,
    
    // Dialog control
    openSettings,
    closeSettings,
    closeKeyRequired,
    handleConfigure
  }
}
