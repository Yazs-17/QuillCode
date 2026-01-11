/**
 * BYOK AI Service Tests
 * 
 * Property-based tests for AI request format correctness.
 * 
 * Feature: quillcode-refactor, Property 7: AI 请求格式正确性
 * Validates: Requirements 6.2, 6.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { BYOKAIService, resetBYOKAIService } from './byokService';
import { deleteDatabase, initDatabase, resetDatabaseState } from '../repositories/browser/db';
import type { ChatMessage, ChatCompletionRequest, AIConfig } from './types';

// ============================================================================
// Test Data Generators (Arbitraries)
// ============================================================================

/**
 * Generate a valid chat message role
 */
const roleArbitrary = fc.constantFrom<'system' | 'user' | 'assistant'>('system', 'user', 'assistant');

/**
 * Generate a valid chat message
 */
const chatMessageArbitrary: fc.Arbitrary<ChatMessage> = fc.record({
  role: roleArbitrary,
  content: fc.string({ minLength: 1, maxLength: 500 })
});

/**
 * Generate an array of chat messages (conversation)
 */
const conversationArbitrary = fc.array(chatMessageArbitrary, { minLength: 1, maxLength: 10 });

/**
 * Generate a valid model name
 */
const modelArbitrary = fc.constantFrom(
  'gpt-3.5-turbo',
  'gpt-4',
  'gpt-4-turbo',
  'deepseek-chat',
  'claude-3-sonnet'
);

/**
 * Generate a valid API endpoint
 */
const endpointArbitrary = fc.constantFrom(
  'https://api.openai.com/v1/chat/completions',
  'https://api.deepseek.com/v1/chat/completions',
  'https://api.anthropic.com/v1/messages'
);

/**
 * Generate a valid API key (mock format)
 */
const apiKeyArbitrary = fc.string({ minLength: 20, maxLength: 100 })
  .filter(s => s.trim().length >= 20);

/**
 * Generate a valid AI config
 */
const aiConfigArbitrary: fc.Arbitrary<AIConfig> = fc.record({
  mode: fc.constant<'byok'>('byok'),
  endpoint: endpointArbitrary,
  model: modelArbitrary,
  apiKey: apiKeyArbitrary
});

// ============================================================================
// Property Tests
// ============================================================================

describe('BYOKAIService', () => {
  beforeEach(async () => {
    // Reset database state and delete any existing database
    resetDatabaseState();
    await deleteDatabase();
    resetBYOKAIService();
    // Initialize fresh database for each test
    await initDatabase();
  });

  afterEach(async () => {
    // Clean up database after each test
    resetDatabaseState();
    await deleteDatabase();
    resetBYOKAIService();
  });

  /**
   * Feature: quillcode-refactor, Property 7: AI 请求格式正确性
   * 
   * For any AI chat request, the request body sent to the API should
   * conform to the OpenAI Chat Completion API format (containing model and messages fields).
   * 
   * Validates: Requirements 6.2, 6.4
   */
  describe('Property 7: AI Request Format Correctness', () => {
    it('should build request body with required model field', async () => {
      await fc.assert(
        fc.asyncProperty(
          conversationArbitrary,
          modelArbitrary,
          async (messages, model) => {
            const service = new BYOKAIService({
              mode: 'byok',
              endpoint: 'https://api.openai.com/v1/chat/completions',
              model: model,
              apiKey: 'test-api-key-12345678901234567890'
            });

            // Build request body
            const requestBody = service.buildRequestBody(messages);

            // Verify model field exists and matches config
            expect(requestBody).toHaveProperty('model');
            expect(requestBody.model).toBe(model);
            expect(typeof requestBody.model).toBe('string');
            expect(requestBody.model.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should build request body with required messages field', async () => {
      await fc.assert(
        fc.asyncProperty(
          conversationArbitrary,
          async (messages) => {
            const service = new BYOKAIService({
              mode: 'byok',
              endpoint: 'https://api.openai.com/v1/chat/completions',
              model: 'gpt-3.5-turbo',
              apiKey: 'test-api-key-12345678901234567890'
            });

            // Build request body
            const requestBody = service.buildRequestBody(messages);

            // Verify messages field exists
            expect(requestBody).toHaveProperty('messages');
            expect(Array.isArray(requestBody.messages)).toBe(true);
            
            // Verify messages array length matches input
            expect(requestBody.messages.length).toBe(messages.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve message structure in request body', async () => {
      await fc.assert(
        fc.asyncProperty(
          conversationArbitrary,
          async (messages) => {
            const service = new BYOKAIService({
              mode: 'byok',
              endpoint: 'https://api.openai.com/v1/chat/completions',
              model: 'gpt-3.5-turbo',
              apiKey: 'test-api-key-12345678901234567890'
            });

            // Build request body
            const requestBody = service.buildRequestBody(messages);

            // Verify each message has correct structure
            for (let i = 0; i < messages.length; i++) {
              const originalMsg = messages[i];
              const requestMsg = requestBody.messages[i];

              // Verify role field
              expect(requestMsg).toHaveProperty('role');
              expect(requestMsg.role).toBe(originalMsg.role);
              expect(['system', 'user', 'assistant']).toContain(requestMsg.role);

              // Verify content field
              expect(requestMsg).toHaveProperty('content');
              expect(requestMsg.content).toBe(originalMsg.content);
              expect(typeof requestMsg.content).toBe('string');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set stream field correctly when streaming', async () => {
      await fc.assert(
        fc.asyncProperty(
          conversationArbitrary,
          fc.boolean(),
          async (messages, shouldStream) => {
            const service = new BYOKAIService({
              mode: 'byok',
              endpoint: 'https://api.openai.com/v1/chat/completions',
              model: 'gpt-3.5-turbo',
              apiKey: 'test-api-key-12345678901234567890'
            });

            // Build request body with stream parameter
            const requestBody = service.buildRequestBody(messages, shouldStream);

            // Verify stream field matches parameter
            expect(requestBody.stream).toBe(shouldStream);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce valid OpenAI-compatible request format', async () => {
      await fc.assert(
        fc.asyncProperty(
          aiConfigArbitrary,
          conversationArbitrary,
          async (config, messages) => {
            const service = new BYOKAIService(config);

            // Build request body
            const requestBody = service.buildRequestBody(messages);

            // Validate complete OpenAI Chat Completion format
            // Required fields
            expect(requestBody).toHaveProperty('model');
            expect(requestBody).toHaveProperty('messages');
            
            // Type validations
            expect(typeof requestBody.model).toBe('string');
            expect(Array.isArray(requestBody.messages)).toBe(true);
            
            // Model should be non-empty
            expect(requestBody.model.length).toBeGreaterThan(0);
            
            // Messages should match input
            expect(requestBody.messages.length).toBe(messages.length);
            
            // Each message should have role and content
            for (const msg of requestBody.messages) {
              expect(msg).toHaveProperty('role');
              expect(msg).toHaveProperty('content');
              expect(['system', 'user', 'assistant']).toContain(msg.role);
              expect(typeof msg.content).toBe('string');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional unit tests for configuration and error handling
   */
  describe('Configuration Management', () => {
    it('should return correct config via getConfig', () => {
      const config: AIConfig = {
        mode: 'byok',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4',
        apiKey: 'test-key-12345678901234567890'
      };

      const service = new BYOKAIService(config);
      const retrievedConfig = service.getConfig();

      expect(retrievedConfig.mode).toBe(config.mode);
      expect(retrievedConfig.endpoint).toBe(config.endpoint);
      expect(retrievedConfig.model).toBe(config.model);
      expect(retrievedConfig.apiKey).toBe(config.apiKey);
    });

    it('should update config via setConfig', () => {
      const service = new BYOKAIService({
        mode: 'byok',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-3.5-turbo',
        apiKey: 'initial-key-12345678901234567890'
      });

      service.setConfig({ model: 'gpt-4' });
      
      const config = service.getConfig();
      expect(config.model).toBe('gpt-4');
      // Other fields should remain unchanged
      expect(config.endpoint).toBe('https://api.openai.com/v1/chat/completions');
    });

    it('should report availability based on API key presence', async () => {
      const serviceWithKey = new BYOKAIService({
        mode: 'byok',
        apiKey: 'test-key-12345678901234567890'
      });
      expect(await serviceWithKey.isAvailable()).toBe(true);

      const serviceWithoutKey = new BYOKAIService({
        mode: 'byok',
        apiKey: undefined
      });
      expect(await serviceWithoutKey.isAvailable()).toBe(false);

      const disabledService = new BYOKAIService({
        mode: 'disabled',
        apiKey: 'test-key-12345678901234567890'
      });
      expect(await disabledService.isAvailable()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should throw API_KEY_MISSING when chat called without API key', async () => {
      const service = new BYOKAIService({
        mode: 'byok',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-3.5-turbo',
        apiKey: undefined
      });

      await expect(service.chat([{ role: 'user', content: 'Hello' }]))
        .rejects.toThrow('请先配置 API Key');
    });

    it('should save and load config from storage', async () => {
      const service = new BYOKAIService({
        mode: 'byok',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4',
        apiKey: 'test-key-for-storage-12345678901234567890'
      });

      // Save config
      await service.saveConfig();

      // Create new service and load config
      const newService = new BYOKAIService();
      const loadedConfig = await newService.loadConfig();

      expect(loadedConfig).not.toBeNull();
      expect(loadedConfig!.model).toBe('gpt-4');
      expect(loadedConfig!.apiKey).toBe('test-key-for-storage-12345678901234567890');
    });
  });
});
