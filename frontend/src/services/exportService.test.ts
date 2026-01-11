/**
 * Export Service Tests
 * 
 * Property-based tests for export data completeness.
 * 
 * Feature: quillcode-refactor, Property 5: 导出数据完整性
 * Validates: Requirements 8.1, 8.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { 
  BrowserExportService, 
  validateExportData, 
  REQUIRED_ARTICLE_FIELDS,
  resetExportService
} from './exportService';
import { BrowserArticleRepository } from '../repositories/browser/articleRepository';
import { BrowserTagRepository } from '../repositories/browser/tagRepository';
import { deleteDatabase, initDatabase, resetDatabaseState } from '../repositories/browser/db';
import { resetSearchEngine } from '../search/searchIndexManager';
import type { ArticleType, Tag, ExportData } from '../repositories/types';
import { RepositoryFactory } from '../repositories/factory';

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
 * Generate a valid tag color
 */
const colorArbitrary = fc.constantFrom(
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'
);

/**
 * Generate tag data for creation
 */
const createTagArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  color: colorArbitrary,
  userId: userIdArbitrary
});

/**
 * Generate article data for creation (without tags for simplicity)
 */
const createArticleArbitrary = fc.record({
  userId: userIdArbitrary,
  title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
  content: fc.option(fc.string({ maxLength: 2000 }), { nil: null }),
  code: fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
  type: articleTypeArbitrary,
  language: languageArbitrary,
  tags: fc.constant([] as Tag[])
});

// ============================================================================
// Property Tests
// ============================================================================

describe('BrowserExportService', () => {
  let exportService: BrowserExportService;
  let articleRepo: BrowserArticleRepository;
  let tagRepo: BrowserTagRepository;

  beforeEach(async () => {
    // Reset all state
    resetDatabaseState();
    await deleteDatabase();
    resetSearchEngine();
    resetExportService();
    RepositoryFactory.clearCache();
    
    // Initialize fresh database
    await initDatabase();
    
    // Create repositories
    articleRepo = new BrowserArticleRepository();
    tagRepo = new BrowserTagRepository();
    exportService = new BrowserExportService(articleRepo, tagRepo);
  });

  afterEach(async () => {
    // Clean up
    resetDatabaseState();
    await deleteDatabase();
    resetSearchEngine();
    resetExportService();
    RepositoryFactory.clearCache();
  });

  /**
   * Feature: quillcode-refactor, Property 5: 导出数据完整性
   * 
   * For any export operation, the exported JSON data should contain all articles,
   * and each article should include complete metadata (id, title, content, code,
   * type, language, tags, createdAt, updatedAt).
   * 
   * Validates: Requirements 8.1, 8.4
   */
  describe('Property 5: Export Data Completeness', () => {
    it('should export all articles with complete metadata', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(createArticleArbitrary, { minLength: 1, maxLength: 10 }),
          async (articlesData) => {
            // Reset state for each iteration
            resetDatabaseState();
            await deleteDatabase();
            resetSearchEngine();
            resetExportService();
            RepositoryFactory.clearCache();
            await initDatabase();
            
            const repo = new BrowserArticleRepository();
            const tagRepoForService = new BrowserTagRepository();
            const service = new BrowserExportService(repo, tagRepoForService);

            // Create all articles
            const createdArticles: Awaited<ReturnType<typeof repo.create>>[] = [];
            for (const data of articlesData) {
              const created = await repo.create(data);
              createdArticles.push(created);
            }

            // Export to JSON
            const blob = await service.exportToJSON();
            const text = await blob.text();
            const exportData: ExportData = JSON.parse(text);

            // Verify export structure
            expect(exportData.version).toBeDefined();
            expect(exportData.exportedAt).toBeDefined();
            expect(Array.isArray(exportData.articles)).toBe(true);
            expect(Array.isArray(exportData.tags)).toBe(true);

            // Verify all articles are exported
            expect(exportData.articles.length).toBe(createdArticles.length);

            // Verify each article has all required fields
            for (const article of exportData.articles) {
              for (const field of REQUIRED_ARTICLE_FIELDS) {
                expect(field in article).toBe(true);
              }
            }

            // Verify each created article is in the export
            for (const created of createdArticles) {
              const exported = exportData.articles.find(a => a.id === created.id);
              expect(exported).toBeDefined();
              expect(exported!.title).toBe(created.title);
              expect(exported!.content).toBe(created.content);
              expect(exported!.code).toBe(created.code);
              expect(exported!.type).toBe(created.type);
              expect(exported!.language).toBe(created.language);
              expect(exported!.userId).toBe(created.userId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should export all tags with complete metadata', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(createTagArbitrary, { minLength: 1, maxLength: 10 }),
          async (tagsData) => {
            // Reset state for each iteration
            resetDatabaseState();
            await deleteDatabase();
            resetSearchEngine();
            resetExportService();
            RepositoryFactory.clearCache();
            await initDatabase();
            
            const repo = new BrowserTagRepository();
            const articleRepoForService = new BrowserArticleRepository();
            const service = new BrowserExportService(articleRepoForService, repo);

            // Create all tags (use unique names to avoid conflicts)
            const createdTags: Awaited<ReturnType<typeof repo.create>>[] = [];
            for (let i = 0; i < tagsData.length; i++) {
              const data = tagsData[i];
              const uniqueName = `${data.name}_${i}_${Date.now()}`;
              const created = await repo.create({
                name: uniqueName,
                color: data.color,
                userId: data.userId
              });
              createdTags.push(created);
            }

            // Export to JSON
            const blob = await service.exportToJSON();
            const text = await blob.text();
            const exportData: ExportData = JSON.parse(text);

            // Verify all tags are exported
            expect(exportData.tags.length).toBe(createdTags.length);

            // Verify each tag has required fields
            for (const tag of exportData.tags) {
              expect(tag.id).toBeDefined();
              expect(tag.name).toBeDefined();
              expect(tag.color).toBeDefined();
              expect(tag.userId).toBeDefined();
              expect(tag.createdAt).toBeDefined();
            }

            // Verify each created tag is in the export
            for (const created of createdTags) {
              const exported = exportData.tags.find(t => t.id === created.id);
              expect(exported).toBeDefined();
              expect(exported!.name).toBe(created.name);
              expect(exported!.color).toBe(created.color);
              expect(exported!.userId).toBe(created.userId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate export data structure correctly', () => {
      // Test validateExportData helper function
      const validData: ExportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        articles: [{
          id: 'test-id',
          userId: 'user-id',
          title: 'Test Article',
          content: 'Test content',
          code: 'console.log("test")',
          type: 'snippet',
          language: 'javascript',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }],
        tags: []
      };

      const result = validateExportData(validData);
      expect(result.valid).toBe(true);
      expect(result.missingFields).toHaveLength(0);
    });

    it('should detect missing fields in export data', () => {
      const invalidData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        articles: [{
          id: 'test-id',
          title: 'Test Article'
          // Missing required fields
        }],
        tags: []
      } as unknown as ExportData;

      const result = validateExportData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.missingFields.length).toBeGreaterThan(0);
    });
  });

  /**
   * Additional unit tests for edge cases
   */
  describe('Edge Cases', () => {
    it('should handle empty database export', async () => {
      const blob = await exportService.exportToJSON();
      const text = await blob.text();
      const exportData: ExportData = JSON.parse(text);

      expect(exportData.version).toBe('1.0');
      expect(exportData.exportedAt).toBeDefined();
      expect(exportData.articles).toEqual([]);
      expect(exportData.tags).toEqual([]);
    });

    it('should export to valid JSON format', async () => {
      // Create a test article
      await articleRepo.create({
        userId: 'test-user',
        title: 'Test Article',
        content: 'Test content',
        code: 'console.log("test")',
        type: 'snippet',
        language: 'javascript',
        tags: []
      });

      const blob = await exportService.exportToJSON();
      
      // Verify blob type
      expect(blob.type).toBe('application/json');
      
      // Verify valid JSON
      const text = await blob.text();
      expect(() => JSON.parse(text)).not.toThrow();
    });

    it('should export to valid ZIP format', async () => {
      // Create a test article
      await articleRepo.create({
        userId: 'test-user',
        title: 'Test Article',
        content: 'Test content',
        code: 'console.log("test")',
        type: 'snippet',
        language: 'javascript',
        tags: []
      });

      const blob = await exportService.exportToMarkdown();
      
      // Verify blob type
      expect(blob.type).toBe('application/zip');
      
      // Verify blob has content
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle special characters in article titles for ZIP export', async () => {
      // Create article with special characters in title
      await articleRepo.create({
        userId: 'test-user',
        title: 'Test: Article <with> "special" chars?',
        content: 'Test content',
        code: null,
        type: 'snippet',
        language: 'javascript',
        tags: []
      });

      // Should not throw
      const blob = await exportService.exportToMarkdown();
      expect(blob.size).toBeGreaterThan(0);
    });
  });
});
