/**
 * BYOK (Bring Your Own Key) AI Service Implementation
 * 
 * Implements the AIService interface for online demo mode.
 * Users provide their own API key to call OpenAI-compatible APIs directly from the browser.
 * 
 * @module ai/byokService
 */

import {
  AIService,
  AIConfig,
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  AIServiceError,
  AIErrorCode,
  DEFAULT_BYOK_CONFIG
} from './types';
import { getByKey, putInStore, STORES } from '../repositories/browser/db';

// ============================================================================
// Constants
// ============================================================================

const AI_CONFIG_KEY = 'ai_config';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

// ============================================================================
// BYOK AI Service Implementation
// ============================================================================

/**
 * BYOK AI Service - allows users to use their own API keys
 * to call OpenAI-compatible AI services directly from the browser.
 */
export class BYOKAIService implements AIService {
  private config: AIConfig;

  constructor(initialConfig?: Partial<AIConfig>) {
    this.config = {
      ...DEFAULT_BYOK_CONFIG,
      ...initialConfig
    };
  }

  /**
   * Initialize the service by loading config from Browser_Storage
   */
  async initialize(): Promise<void> {
    try {
      const stored = await getByKey<{ key: string; value: AIConfig }>(
        STORES.SETTINGS,
        AI_CONFIG_KEY
      );
      if (stored?.value) {
        this.config = { ...this.config, ...stored.value };
      }
    } catch {
      // Use default config if loading fails
      console.warn('Failed to load AI config from storage, using defaults');
    }
  }

  /**
   * Check if the AI service is available and properly configured
   */
  async isAvailable(): Promise<boolean> {
    return this.config.mode === 'byok' && !!this.config.apiKey;
  }

  /**
   * Send a chat completion request and get the response
   */
  async chat(messages: ChatMessage[]): Promise<string> {
    this.validateConfig();

    const requestBody = this.buildRequestBody(messages);
    const response = await this.sendRequest(requestBody);
    
    return this.extractContent(response);
  }

  /**
   * Send a streaming chat completion request
   */
  async stream(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void
  ): Promise<void> {
    this.validateConfig();

    const requestBody = this.buildRequestBody(messages, true);
    
    const response = await fetch(this.config.endpoint!, {
      method: 'POST',
      headers: this.buildHeaders(),
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
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch {
              // Skip malformed JSON chunks
            }
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
   * Update the AI configuration and persist to Browser_Storage
   */
  setConfig(config: Partial<AIConfig>): void {
    this.config = { ...this.config, ...config };
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
      console.error('Failed to save AI config:', error);
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

  /**
   * Clear the stored API key
   */
  async clearApiKey(): Promise<void> {
    this.config.apiKey = undefined;
    await this.saveConfig();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Validate that the configuration is complete for making requests
   */
  private validateConfig(): void {
    if (!this.config.apiKey) {
      throw new AIServiceError(
        '请先配置 API Key',
        AIErrorCode.API_KEY_MISSING
      );
    }

    if (!this.config.endpoint) {
      throw new AIServiceError(
        'API endpoint not configured',
        AIErrorCode.SERVICE_UNAVAILABLE
      );
    }

    if (!this.config.model) {
      throw new AIServiceError(
        'Model not configured',
        AIErrorCode.MODEL_NOT_FOUND
      );
    }
  }

  /**
   * Build the request body for chat completion
   */
  buildRequestBody(messages: ChatMessage[], stream = false): ChatCompletionRequest {
    return {
      model: this.config.model!,
      messages: messages,
      stream
    };
  }

  /**
   * Build request headers
   */
  private buildHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Send the API request with timeout
   */
  private async sendRequest(body: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    try {
      const response = await fetch(this.config.endpoint!, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await response.json();
      return data as ChatCompletionResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof AIServiceError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new AIServiceError(
            'Request timed out',
            AIErrorCode.SERVICE_UNAVAILABLE,
            true
          );
        }

        throw new AIServiceError(
          `Network error: ${error.message}`,
          AIErrorCode.NETWORK_ERROR,
          true
        );
      }

      throw new AIServiceError(
        'Unknown error occurred',
        AIErrorCode.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Handle error responses from the API
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = 'AI service error';
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorMessage;
    } catch {
      // Use default error message
    }

    switch (response.status) {
      case 401:
        throw new AIServiceError(
          'API Key 无效，请检查配置',
          AIErrorCode.API_KEY_INVALID
        );
      case 429:
        throw new AIServiceError(
          'API 请求频率超限，请稍后重试',
          AIErrorCode.RATE_LIMITED,
          true
        );
      case 404:
        throw new AIServiceError(
          `Model not found: ${this.config.model}`,
          AIErrorCode.MODEL_NOT_FOUND
        );
      default:
        throw new AIServiceError(
          errorMessage,
          AIErrorCode.SERVICE_UNAVAILABLE,
          response.status >= 500
        );
    }
  }

  /**
   * Extract content from the API response
   */
  private extractContent(response: ChatCompletionResponse): string {
    const content = response.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new AIServiceError(
        'Invalid response format',
        AIErrorCode.INVALID_RESPONSE
      );
    }

    return content;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create and initialize a BYOK AI Service instance
 */
export async function createBYOKAIService(
  initialConfig?: Partial<AIConfig>
): Promise<BYOKAIService> {
  const service = new BYOKAIService(initialConfig);
  await service.initialize();
  return service;
}

/**
 * Singleton instance for the application
 */
let serviceInstance: BYOKAIService | null = null;

/**
 * Get the singleton BYOK AI Service instance
 */
export async function getBYOKAIService(): Promise<BYOKAIService> {
  if (!serviceInstance) {
    serviceInstance = await createBYOKAIService();
  }
  return serviceInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetBYOKAIService(): void {
  serviceInstance = null;
}
