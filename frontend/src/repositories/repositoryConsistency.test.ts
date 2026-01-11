/**
 * Repository Implementation Consistency Tests
 * 
 * Property-based tests for verifying that Repository implementations
 * follow the DataRepository interface contract consistently.
 * 
 * Feature: quillcode-refactor, Property 6: Repository 实现一致性
 * Validates: Requirements 12.4, 12.5
 * 
 * Since the API/SQLite repository is not yet implemented, these tests verify:
 * 1. BrowserArticleRepository and BrowserTagRepository follow the same interface contract
 * 2. CRUD operations produce consistent and predictable results
 * 3. The same operations on the same data produce equivalent outputs
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { BrowserArticleRepository } from './browser/articleRepository';
import { BrowserTagRepository } from './browser/tagRepository';
import { deleteDatabase, initDatabase, resetDatabaseState } from './browser/db';
import { resetSearchEngine } from '../search/searchIndexManager';
import type { ArticleType, Tag, Article, DataRepository } from './types';

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
 * Generate a valid tag color (hex format)
 */
const colorArbitrary = fc.hexaString({ minLength: 6, maxLength: 6 }).map(s => `#${s}`);

/**
 * Generate article data for creation
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

/**
 * Generate tag data for creation
 */
const createTagArbitrary = fc.record({
  userId: userIdArbitrary,
  name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  color: colorArbitrary
});

// ============================================================================
// Property Tests
// ============================================================================

describe('Property 6: Repository Implementation Consistency', () => {
  let articleRepo: BrowserArticleRepository;
  let tagRepo: BrowserTagRepository;

  beforeEach(async () => {
    resetDatabaseState();
    await deleteDatabase();
    resetSearchEngine();
    await initDatabase();
    articleRepo = new BrowserArticleRepository();
    tagRepo = new BrowserTagRepository();
  });

  afterEach(async () => {
    resetDatabaseState();
    await deleteDatabase();
    resetSearchEngine();
  });

  /**
   * Feature: quillcode-refactor, Property 6: Repository 实现一致性
   * 
   * For any CRUD operation sequence, different Repository implementations
   * should produce equivalent results for the same inputs.
   * 
   * Validates: Requirements 12.4, 12.5
   */
  describe('Interface Contract Consistency', () => {
    /**
     * Test that both ArticleRepository and TagRepository follow the same
     * DataRepository interface contract for basic CRUD operations.
     */
    it('should follow consistent interface contract for create operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          createArticleArbitrary,
          createTagArbitrary,
          async (articleData, tagData) => {
            // Create article
            const createdArticle = await articleRepo.create(articleData);
            
            // Create tag
            const createdTag = await tagRepo.create(tagData);

            // Both should have auto-generated id
            expect(createdArticle.id).toBeDefined();
            expect(createdArticle.id.length).toBeGreaterThan(0);
            expect(createdTag.id).toBeDefined();
            expect(createdTag.id.length).toBeGreaterThan(0);

            // Both should have createdAt timestamp
            expect(createdArticle.createdAt).toBeInstanceOf(Date);
            expect(createdTag.createdAt).toBeInstanceOf(Date);

            // Both should preserve input data
            expect(createdArticle.title).toBe(articleData.title);
            expect(createdArticle.userId).toBe(articleData.userId);
            expect(createdTag.name).toBe(tagData.name);
            expect(createdTag.userId).toBe(tagData.userId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should follow consistent interface contract for findById operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          createArticleArbitrary,
          createTagArbitrary,
          async (articleData, tagData) => {
            // Create entities
            const createdArticle = await articleRepo.create(articleData);
            const createdTag = await tagRepo.create(tagData);

            // Find by ID should return the same entity
            const foundArticle = await articleRepo.findById(createdArticle.id);
            const foundTag = await tagRepo.findById(createdTag.id);

            expect(foundArticle).not.toBeNull();
            expect(foundTag).not.toBeNull();

            // Data should match
            expect(foundArticle!.id).toBe(createdArticle.id);
            expect(foundArticle!.title).toBe(createdArticle.title);
            expect(foundTag!.id).toBe(createdTag.id);
            expect(foundTag!.name).toBe(createdTag.name);

            // Non-existent IDs should return null for both
            const nonExistentArticle = await articleRepo.findById('non-existent-id');
            const nonExistentTag = await tagRepo.findById('non-existent-id');
            expect(nonExistentArticle).toBeNull();
            expect(nonExistentTag).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should follow consistent interface contract for update operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          createArticleArbitrary,
          createTagArbitrary,
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          async (articleData, tagData, newValue) => {
            // Create entities
            const createdArticle = await articleRepo.create(articleData);
            const createdTag = await tagRepo.create(tagData);

            // Update entities
            const updatedArticle = await articleRepo.update(createdArticle.id, { title: newValue });
            const updatedTag = await tagRepo.update(createdTag.id, { name: newValue });

            // Updates should return updated entity
            expect(updatedArticle.title).toBe(newValue);
            expect(updatedTag.name).toBe(newValue);

            // ID should not change
            expect(updatedArticle.id).toBe(createdArticle.id);
            expect(updatedTag.id).toBe(createdTag.id);

            // createdAt should not change
            expect(updatedArticle.createdAt.getTime()).toBe(createdArticle.createdAt.getTime());
            expect(updatedTag.createdAt.getTime()).toBe(createdTag.createdAt.getTime());

            // Verify persistence
            const retrievedArticle = await articleRepo.findById(createdArticle.id);
            const retrievedTag = await tagRepo.findById(createdTag.id);
            expect(retrievedArticle!.title).toBe(newValue);
            expect(retrievedTag!.name).toBe(newValue);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should follow consistent interface contract for delete operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          createArticleArbitrary,
          createTagArbitrary,
          async (articleData, tagData) => {
            // Create entities
            const createdArticle = await articleRepo.create(articleData);
            const createdTag = await tagRepo.create(tagData);

            // Verify they exist
            expect(await articleRepo.findById(createdArticle.id)).not.toBeNull();
            expect(await tagRepo.findById(createdTag.id)).not.toBeNull();

            // Delete entities
            await articleRepo.delete(createdArticle.id);
            await tagRepo.delete(createdTag.id);

            // Verify they are deleted
            expect(await articleRepo.findById(createdArticle.id)).toBeNull();
            expect(await tagRepo.findById(createdTag.id)).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should follow consistent interface contract for count operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(createArticleArbitrary, { minLength: 0, maxLength: 5 }),
          fc.array(createTagArbitrary, { minLength: 0, maxLength: 5 }),
          async (articlesData, tagsData) => {
            // Reset for each iteration
            resetDatabaseState();
            await deleteDatabase();
            resetSearchEngine();
            await initDatabase();
            const aRepo = new BrowserArticleRepository();
            const tRepo = new BrowserTagRepository();

            // Create entities
            for (const data of articlesData) {
              await aRepo.create(data);
            }
            for (const data of tagsData) {
              await tRepo.create(data);
            }

            // Count should match number of created entities
            const articleCount = await aRepo.count();
            const tagCount = await tRepo.count();

            expect(articleCount).toBe(articlesData.length);
            expect(tagCount).toBe(tagsData.length);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should follow consistent interface contract for findAll operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(createArticleArbitrary, { minLength: 1, maxLength: 5 }),
          fc.array(createTagArbitrary, { minLength: 1, maxLength: 5 }),
          async (articlesData, tagsData) => {
            // Reset for each iteration
            resetDatabaseState();
            await deleteDatabase();
            resetSearchEngine();
            await initDatabase();
            const aRepo = new BrowserArticleRepository();
            const tRepo = new BrowserTagRepository();

            // Create entities
            const createdArticles: Article[] = [];
            const createdTags: Tag[] = [];
            
            for (const data of articlesData) {
              createdArticles.push(await aRepo.create(data));
            }
            for (const data of tagsData) {
              createdTags.push(await tRepo.create(data));
            }

            // FindAll should return all entities
            const allArticles = await aRepo.findAll();
            const allTags = await tRepo.findAll();

            expect(allArticles.length).toBe(articlesData.length);
            expect(allTags.length).toBe(tagsData.length);

            // All created entities should be in the result
            for (const created of createdArticles) {
              expect(allArticles.some(a => a.id === created.id)).toBe(true);
            }
            for (const created of createdTags) {
              expect(allTags.some(t => t.id === created.id)).toBe(true);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Operation Idempotence and Consistency', () => {
    /**
     * Test that reading the same entity multiple times produces identical results
     */
    it('should produce identical results for repeated read operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          createArticleArbitrary,
          async (articleData) => {
            const created = await articleRepo.create(articleData);

            // Read multiple times
            const read1 = await articleRepo.findById(created.id);
            const read2 = await articleRepo.findById(created.id);
            const read3 = await articleRepo.findById(created.id);

            // All reads should produce identical results
            expect(read1).not.toBeNull();
            expect(read2).not.toBeNull();
            expect(read3).not.toBeNull();

            expect(read1!.id).toBe(read2!.id);
            expect(read2!.id).toBe(read3!.id);
            expect(read1!.title).toBe(read2!.title);
            expect(read2!.title).toBe(read3!.title);
            expect(read1!.content).toBe(read2!.content);
            expect(read2!.content).toBe(read3!.content);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that update operations are consistent
     */
    it('should produce consistent results for sequential updates', async () => {
      await fc.assert(
        fc.asyncProperty(
          createArticleArbitrary,
          fc.array(
            fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            { minLength: 1, maxLength: 5 }
          ),
          async (articleData, titles) => {
            const created = await articleRepo.create(articleData);

            // Apply sequential updates
            let lastTitle = articleData.title;
            for (const newTitle of titles) {
              const updated = await articleRepo.update(created.id, { title: newTitle });
              expect(updated.title).toBe(newTitle);
              lastTitle = newTitle;
            }

            // Final read should reflect last update
            const final = await articleRepo.findById(created.id);
            expect(final!.title).toBe(lastTitle);
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Test that delete is idempotent (deleting non-existent entity doesn't throw)
     */
    it('should handle delete of non-existent entity gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          createArticleArbitrary,
          async (articleData) => {
            const created = await articleRepo.create(articleData);

            // Delete once
            await articleRepo.delete(created.id);
            expect(await articleRepo.findById(created.id)).toBeNull();

            // Delete again should not throw
            await expect(articleRepo.delete(created.id)).resolves.not.toThrow();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Query Options Consistency', () => {
    /**
     * Test that pagination options work consistently across repositories
     */
    it('should apply pagination options consistently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(createArticleArbitrary, { minLength: 5, maxLength: 10 }),
          fc.integer({ min: 0, max: 3 }),
          fc.integer({ min: 1, max: 3 }),
          async (articlesData, offset, limit) => {
            // Reset for each iteration
            resetDatabaseState();
            await deleteDatabase();
            resetSearchEngine();
            await initDatabase();
            const repo = new BrowserArticleRepository();

            // Create entities
            for (const data of articlesData) {
              await repo.create(data);
            }

            // Query with pagination
            const paginated = await repo.findAll({ offset, limit });

            // Result should respect limit
            expect(paginated.length).toBeLessThanOrEqual(limit);

            // Result should respect offset (if enough data)
            const allArticles = await repo.findAll();
            const expectedLength = Math.min(limit, Math.max(0, allArticles.length - offset));
            expect(paginated.length).toBe(expectedLength);
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Test that sorting options work consistently
     */
    it('should apply sorting options consistently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(createArticleArbitrary, { minLength: 2, maxLength: 5 }),
          fc.constantFrom('ASC', 'DESC') as fc.Arbitrary<'ASC' | 'DESC'>,
          async (articlesData, order) => {
            // Reset for each iteration
            resetDatabaseState();
            await deleteDatabase();
            resetSearchEngine();
            await initDatabase();
            const repo = new BrowserArticleRepository();

            // Create entities
            for (const data of articlesData) {
              await repo.create(data);
            }

            // Query with sorting by title
            const sorted = await repo.findAll({ orderBy: 'title', order });

            // Verify sorting
            for (let i = 1; i < sorted.length; i++) {
              const prev = sorted[i - 1].title;
              const curr = sorted[i].title;
              if (order === 'ASC') {
                expect(prev <= curr).toBe(true);
              } else {
                expect(prev >= curr).toBe(true);
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
