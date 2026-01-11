/**
 * Browser Article Repository Tests
 * 
 * Property-based tests for data persistence round-trip.
 * 
 * Feature: quillcode-refactor, Property 1: 数据持久化 Round-Trip
 * Validates: Requirements 1.1, 1.2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { BrowserArticleRepository } from './articleRepository';
import { BrowserTagRepository } from './tagRepository';
import { deleteDatabase, initDatabase, resetDatabaseState } from './db';
import { resetSearchEngine } from '../../search/searchIndexManager';
import type { ArticleType, Tag, Article } from '../types';

// ============================================================================
// Test Data Generators (Arbitraries)
// ============================================================================

/**
 * Generate a valid article type
 */
const articleTypeArbitrary = fc.constantFrom<ArticleType>('algorithm', 'snippet', 'html');

/**
 * Generate a valid programming language
 */
const languageArbitrary = fc.constantFrom(
  'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c', 'cpp'
);

/**
 * Generate a valid user ID
 */
const userIdArbitrary = fc.uuid();

/**
 * Generate article data for creation (without tags for simplicity)
 */
const createArticleArbitrary = fc.record({
  userId: userIdArbitrary,
  title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
  content: fc.option(fc.string({ maxLength: 5000 }), { nil: null }),
  code: fc.option(fc.string({ maxLength: 3000 }), { nil: null }),
  type: articleTypeArbitrary,
  language: languageArbitrary,
  tags: fc.constant([] as Tag[])
});

// ============================================================================
// Property Tests
// ============================================================================

describe('BrowserArticleRepository', () => {
  let articleRepo: BrowserArticleRepository;

  beforeEach(async () => {
    // Reset database state and delete any existing database
    resetDatabaseState();
    await deleteDatabase();
    // Reset search engine to ensure clean state
    resetSearchEngine();
    // Initialize fresh database for each test
    await initDatabase();
    articleRepo = new BrowserArticleRepository();
  });

  afterEach(async () => {
    // Clean up database after each test
    resetDatabaseState();
    await deleteDatabase();
    // Reset search engine to prevent async vacuuming errors
    resetSearchEngine();
  });

  /**
   * Feature: quillcode-refactor, Property 1: 数据持久化 Round-Trip
   * 
   * For any valid article data, creating then retrieving should return
   * equivalent data (except for auto-generated timestamps and ID).
   * 
   * Validates: Requirements 1.1, 1.2
   */
  describe('Property 1: Data Persistence Round-Trip', () => {
    it('should persist and retrieve equivalent article data', async () => {
      await fc.assert(
        fc.asyncProperty(
          createArticleArbitrary,
          async (articleData) => {
            // Create article
            const created = await articleRepo.create(articleData);

            // Verify created article has required fields
            expect(created.id).toBeDefined();
            expect(created.id.length).toBeGreaterThan(0);
            expect(created.createdAt).toBeInstanceOf(Date);
            expect(created.updatedAt).toBeInstanceOf(Date);

            // Retrieve article
            const retrieved = await articleRepo.findById(created.id);

            // Verify retrieved article exists
            expect(retrieved).not.toBeNull();

            // Verify data equivalence (excluding auto-generated fields)
            expect(retrieved!.title).toBe(articleData.title);
            expect(retrieved!.content).toBe(articleData.content);
            expect(retrieved!.code).toBe(articleData.code);
            expect(retrieved!.type).toBe(articleData.type);
            expect(retrieved!.language).toBe(articleData.language);
            expect(retrieved!.userId).toBe(articleData.userId);

            // Verify ID consistency
            expect(retrieved!.id).toBe(created.id);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should persist multiple articles and retrieve them all', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(createArticleArbitrary, { minLength: 1, maxLength: 10 }),
          async (articlesData) => {
            // Clean database before each iteration
            resetDatabaseState();
            await deleteDatabase();
            resetSearchEngine();
            await initDatabase();
            const repo = new BrowserArticleRepository();

            // Create all articles
            const createdArticles: Article[] = [];
            for (const data of articlesData) {
              const created = await repo.create(data);
              createdArticles.push(created);
            }

            // Retrieve all articles
            const allArticles = await repo.findAll();

            // Verify count matches
            expect(allArticles.length).toBe(articlesData.length);

            // Verify each created article can be found
            for (const created of createdArticles) {
              const found = allArticles.find(a => a.id === created.id);
              expect(found).toBeDefined();
              expect(found!.title).toBe(created.title);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should update article and persist changes', async () => {
      await fc.assert(
        fc.asyncProperty(
          createArticleArbitrary,
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          async (articleData, newTitle) => {
            // Create article
            const created = await articleRepo.create(articleData);

            // Update article
            const updated = await articleRepo.update(created.id, { title: newTitle });

            // Verify update returned correct data
            expect(updated.title).toBe(newTitle);
            expect(updated.id).toBe(created.id);

            // Retrieve and verify persistence
            const retrieved = await articleRepo.findById(created.id);
            expect(retrieved!.title).toBe(newTitle);

            // Verify other fields unchanged
            expect(retrieved!.content).toBe(articleData.content);
            expect(retrieved!.code).toBe(articleData.code);
            expect(retrieved!.type).toBe(articleData.type);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should delete article and remove from storage', async () => {
      await fc.assert(
        fc.asyncProperty(
          createArticleArbitrary,
          async (articleData) => {
            // Create article
            const created = await articleRepo.create(articleData);

            // Verify it exists
            const beforeDelete = await articleRepo.findById(created.id);
            expect(beforeDelete).not.toBeNull();

            // Delete article
            await articleRepo.delete(created.id);

            // Verify it's gone
            const afterDelete = await articleRepo.findById(created.id);
            expect(afterDelete).toBeNull();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Additional unit tests for edge cases
   */
  describe('Edge Cases', () => {
    it('should return null for non-existent article', async () => {
      const result = await articleRepo.findById('non-existent-id');
      expect(result).toBeNull();
    });

    it('should throw error when updating non-existent article', async () => {
      await expect(
        articleRepo.update('non-existent-id', { title: 'New Title' })
      ).rejects.toThrow();
    });

    it('should handle empty findAll', async () => {
      const result = await articleRepo.findAll();
      expect(result).toEqual([]);
    });

    it('should count articles correctly', async () => {
      const article1 = await articleRepo.create({
        userId: 'user-1',
        title: 'Article 1',
        content: 'Content 1',
        code: null,
        type: 'snippet',
        language: 'javascript',
        tags: []
      });

      const article2 = await articleRepo.create({
        userId: 'user-1',
        title: 'Article 2',
        content: 'Content 2',
        code: null,
        type: 'snippet',
        language: 'typescript',
        tags: []
      });

      const count = await articleRepo.count();
      expect(count).toBe(2);
    });
  });
});
