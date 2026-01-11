/**
 * AI Service Types and Interfaces
 * Defines the abstraction layer for AI services supporting BYOK and Ollama modes
 */

/**
 * Chat message format compatible with OpenAI API
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * AI service configuration
 */
export interface AIConfig {
  mode: 'byok' | 'ollama' | 'disabled';
  endpoint?: string;
  model?: string;
  apiKey?: string;
}

/**
 * AI chat completion request body (OpenAI compatible format)
 */
export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * AI chat completion response (OpenAI compatible format)
 */
export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * AI Service error codes
 */
export enum AIErrorCode {
  API_KEY_INVALID = 'API_KEY_INVALID',
  API_KEY_MISSING = 'API_KEY_MISSING',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  OLLAMA_NOT_RUNNING = 'OLLAMA_NOT_RUNNING',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE'
}

/**
 * AI Service error class
 */
export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: AIErrorCode,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

/**
 * AI Service interface - unified abstraction for different AI backends
 */
export interface AIService {
  /**
   * Check if the AI service is available and properly configured
   */
  isAvailable(): Promise<boolean>;

  /**
   * Send a chat completion request and get the response
   * @param messages Array of chat messages
   * @returns The assistant's response content
   */
  chat(messages: ChatMessage[]): Promise<string>;

  /**
   * Send a streaming chat completion request
   * @param messages Array of chat messages
   * @param onChunk Callback for each streamed chunk
   */
  stream(messages: ChatMessage[], onChunk: (chunk: string) => void): Promise<void>;

  /**
   * Get the current AI configuration
   */
  getConfig(): AIConfig;

  /**
   * Update the AI configuration
   * @param config New configuration to apply
   */
  setConfig(config: Partial<AIConfig>): void;
}

/**
 * Default AI configurations
 */
export const DEFAULT_BYOK_CONFIG: AIConfig = {
  mode: 'byok',
  endpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-3.5-turbo'
};

export const DEFAULT_OLLAMA_CONFIG: AIConfig = {
  mode: 'ollama',
  endpoint: 'http://localhost:11434/api/chat',
  model: 'llama2'
};

export const DISABLED_CONFIG: AIConfig = {
  mode: 'disabled'
};
