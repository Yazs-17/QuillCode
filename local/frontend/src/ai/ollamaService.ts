/**
 * Ollama AI Service Implementation
 * 
 * Implements the AIService interface for local deployment mode.
 * Connects to a local Ollama instance for AI inference.
 * 
 * @module ai/ollamaService
 */

import {
  AIService,
  AIConfig,
  ChatMessage,
  AIServiceError,
  AIErrorCode,
  DEFAULT_OLLAMA_CONFIG
} from './types';
import { getByKey, putInStore, STORES } from '../repositories/browser/db';

// ============================================================================
// Constants
// ============================================================================

const AI_CONFIG_KEY = 'ai_config';
const DEFAULT_TIMEOUT = 60000; // 60 seconds for local inference
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds for health check

// ============================================================================
// Ollama API Types
// ============================================================================

/**
 * Ollama chat request format
 */
interface OllamaChatRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

/**
 * Ollama chat response format
 */
interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: ChatMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

/**
 * Ollama tags response (list of models)
 */
interface OllamaTagsResponse {
  models: {
    name: string;
    modified_at: string;
    size: number;
  }[];
}

// ============================================================================
// Ollama AI Service Implementation
// ============================================================================

/**
 * Ollama AI Service - connects to local Ollama instance for AI inference.
 * Supports automatic service detection and connection.
 */
export class OllamaAIService implements AIService {
  private config: AIConfig;
  private available: boolean = false;
  private availableModels: string[] = [];

  constructor(initialConfig?: Partial<AIConfig>) {
    this.config = {
      ...DEFAULT_OLLAMA_CONFIG,
      ...initialConfig
    };
  }

  /**
   * Initialize the service by loading config and checking Ollama availability
   */
  async initialize(): Promise<void> {
    try {
      // Load saved config from storage
      const stored = await getByKey<{ key: string; value: AIConfig }>(
        STORES.SETTINGS,
        AI_CONFIG_KEY
      );
      if (stored?.value && stored.value.mode === 'ollama') {
        this.config = { ...this.config, ...stored.value };
      }
    } catch {
      console.warn('Failed to load Ollama config from storage, using defaults');
    }

    // Check if Ollama service is available
    await this.detectService();
  }

  /**
   * Detect if Ollama service is running and available
   */
  async detectService(): Promise<boolean> {
    try {
      const baseUrl = this.getBaseUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

      const response = await fetch(`${baseUrl}/api/tags`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data: OllamaTagsResponse = await response.json();
        this.availableModels = data.models?.map(m => m.name) || [];
        this.available = true;
        
        // Auto-select first available model if current model is not available
        if (this.availableModels.length > 0 && !this.availableModels.includes(this.config.model || '')) {
          this.config.model = this.availableModels[0];
        }
        
        return true;
      }
      
      this.available = false;
      return false;
    } catch {
      this.available = false;
      return false;
    }
  }

  /**
   * Check if the AI service is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.available) {
      await this.detectService();
    }
    return this.available && this.config.mode === 'ollama';
  }

  /**
   * Get list of available models from Ollama
   */
  getAvailableModels(): string[] {
    return [...this.availableModels];
  }

  /**
   * Send a chat completion request and get the response
   */
  async chat(messages: ChatMessage[]): Promise<string> {
    await this.validateAndConnect();

    const requestBody: OllamaChatRequest = {
      model: this.config.model!,
      messages: messages,
      stream: false
    };

    const response = await this.sendRequest(requestBody);
    return response.message.content;
  }

  /**
   * Send a streaming chat completion request
   */
  async stream(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void
  ): Promise<void> {
    await this.validateAndConnect();

    const requestBody: OllamaChatRequest = {
      model: this.config.model!,
      messages: messages,
      stream: true
    };

    const response = await fetch(`${this.getBaseUrl()}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    if (!response.body) {
      throw new AIServiceError(
        'Streaming not supported',
        AIErrorCode.SERVICE_UNAVAILABLE
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          try {
            const parsed: OllamaChatResponse = JSON.parse(line);
            if (parsed.message?.content) {
              onChunk(parsed.message.content);
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Get the current AI configuration
   */
  getConfig(): AIConfig {
    return { ...this.config };
  }

  /**
   * Update the AI configuration
   */
  setConfig(config: Partial<AIConfig>): void {
    this.config = { ...this.config, ...config };
    // Reset availability check when endpoint changes
    if (config.endpoint) {
      this.available = false;
    }
  }

  /**
   * Save the current configuration to Browser_Storage
   */
  async saveConfig(): Promise<void> {
    try {
      await putInStore(STORES.SETTINGS, {
        key: AI_CONFIG_KEY,
        value: this.config
      });
    } catch (error) {
      console.error('Failed to save Ollama config:', error);
      throw new AIServiceError(
        'Failed to save AI configuration',
        AIErrorCode.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Load configuration from Browser_Storage
   */
  async loadConfig(): Promise<AIConfig | null> {
    try {
      const stored = await getByKey<{ key: string; value: AIConfig }>(
        STORES.SETTINGS,
        AI_CONFIG_KEY
      );
      if (stored?.value) {
        this.config = { ...this.config, ...stored.value };
        return this.config;
      }
      return null;
    } catch {
      return null;
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Get the base URL for Ollama API (without /api/chat)
   */
  private getBaseUrl(): string {
    const endpoint = this.config.endpoint || DEFAULT_OLLAMA_CONFIG.endpoint!;
    // Remove /api/chat suffix if present to get base URL
    return endpoint.replace(/\/api\/chat\/?$/, '');
  }

  /**
   * Validate configuration and ensure Ollama is connected
   */
  private async validateAndConnect(): Promise<void> {
    if (!this.available) {
      const isRunning = await this.detectService();
      if (!isRunning) {
        throw new AIServiceError(
          'Ollama 服务未运行，请启动 Ollama 后重试',
          AIErrorCode.OLLAMA_NOT_RUNNING
        );
      }
    }

    if (!this.config.model) {
      throw new AIServiceError(
        '未配置 AI 模型',
        AIErrorCode.MODEL_NOT_FOUND
      );
    }

    // Check if selected model is available
    if (this.availableModels.length > 0 && !this.availableModels.includes(this.config.model)) {
      throw new AIServiceError(
        `模型 ${this.config.model} 不可用，请先运行 ollama pull ${this.config.model}`,
        AIErrorCode.MODEL_NOT_FOUND
      );
    }
  }

  /**
   * Send the API request with timeout
   */
  private async sendRequest(body: OllamaChatRequest): Promise<OllamaChatResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    try {
      const response = await fetch(`${this.getBaseUrl()}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await response.json();
      return data as OllamaChatResponse;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof AIServiceError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new AIServiceError(
            '请求超时，本地推理可能需要更长时间',
            AIErrorCode.SERVICE_UNAVAILABLE,
            true
          );
        }

        // Connection refused typically means Ollama is not running
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          this.available = false;
          throw new AIServiceError(
            'Ollama 服务未运行，请启动 Ollama 后重试',
            AIErrorCode.OLLAMA_NOT_RUNNING
          );
        }

        throw new AIServiceError(
          `网络错误: ${error.message}`,
          AIErrorCode.NETWORK_ERROR,
          true
        );
      }

      throw new AIServiceError(
        '未知错误',
        AIErrorCode.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Handle error responses from Ollama API
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = 'Ollama 服务错误';

    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // Use default error message
    }

    switch (response.status) {
      case 404:
        throw new AIServiceError(
          `模型未找到: ${this.config.model}`,
          AIErrorCode.MODEL_NOT_FOUND
        );
      case 500:
        throw new AIServiceError(
          errorMessage,
          AIErrorCode.SERVICE_UNAVAILABLE,
          true
        );
      default:
        throw new AIServiceError(
          errorMessage,
          AIErrorCode.SERVICE_UNAVAILABLE,
          response.status >= 500
        );
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create and initialize an Ollama AI Service instance
 */
export async function createOllamaAIService(
  initialConfig?: Partial<AIConfig>
): Promise<OllamaAIService> {
  const service = new OllamaAIService(initialConfig);
  await service.initialize();
  return service;
}

/**
 * Singleton instance for the application
 */
let serviceInstance: OllamaAIService | null = null;

/**
 * Get the singleton Ollama AI Service instance
 */
export async function getOllamaAIService(): Promise<OllamaAIService> {
  if (!serviceInstance) {
    serviceInstance = await createOllamaAIService();
  }
  return serviceInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetOllamaAIService(): void {
  serviceInstance = null;
}
