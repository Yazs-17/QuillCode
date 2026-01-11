/**
 * DataAdapter Service
 * 
 * Unified data access service that provides API-compatible interfaces
 * while abstracting the underlying storage implementation.
 * 
 * This service bridges the gap between the existing API-based services
 * and the new Repository pattern, allowing seamless switching between
 * browser storage (IndexedDB) and server-side storage (API).
 * 
 * @module services/dataAdapter
 */

import { RepositoryFactory } from '../repositories/factory';
import { EnvironmentDetector } from '../utils/environment';
import type {
  Article,
  Tag,
  ArticleRepository,
  TagRepository,
  SearchEngine,
  SearchResult,
  QueryOptions,
  SearchOptions,
  CreateArticleDto,
  UpdateArticleDto
} from '../repositories/types';

/**
 * API-compatible response format
 */
export interface ApiResponse<T> {
  data: T;
  code: number;
  message: string;
}

/**
 * Pagination parameters matching existing API
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'ASC' | 'DESC';
}

/**
 * DataAdapter class
 * 
 * Provides a unified interface for data operations that works with both
 * browser storage and server API, maintaining compatibility with existing
 * service layer expectations.
 */
export class DataAdapter {
  private static instance: DataAdapter | null = null;
  private articleRepository: ArticleRepository | null = null;
  private tagRepository: TagRepository | null = null;
  private searchEngine: SearchEngine | null = null;
  private initialized = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): DataAdapter {
    if (!DataAdapter.instance) {
      DataAdapter.instance = new DataAdapter();
    }
    return DataAdapter.instance;
  }

  /**
   * Initialize the adapter
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('[DataAdapter] Initializing...');
    
    await RepositoryFactory.initialize();
    
    this.articleRepository = await RepositoryFactory.createArticleRepository();
    this.tagRepository = await RepositoryFactory.createTagRepository();
    this.searchEngine = await RepositoryFactory.createSearchEngine();
    
    this.initialized = true;
    console.log('[DataAdapter] Initialization complete');
  }

  /**
   * Check if using browser storage mode
   */
  isBrowserMode(): boolean {
    return RepositoryFactory.isBrowserStorage();
  }

  /**
   * Check if using API mode
   */
  isApiMode(): boolean {
    return RepositoryFactory.isApiStorage();
  }

  // ============================================================================
  // Article Operations
  // ============================================================================

  /**
   * Get all articles with pagination
   */
  async getArticles(params: PaginationParams = {}): Promise<Article[]> {
    await this.ensureInitialized();
    
    const options: QueryOptions = {
      limit: params.limit,
      offset: params.page ? (params.page - 1) * (params.limit || 10) : undefined,
      orderBy: params.orderBy || 'createdAt',
      order: params.order || 'DESC'
    };

    return this.articleRepository!.findAll(options);
  }

  /**
   * Get articles by user ID
   */
  async getArticlesByUserId(userId: string, params: PaginationParams = {}): Promise<Article[]> {
    await this.ensureInitialized();
    
    const options: QueryOptions = {
      limit: params.limit,
      offset: params.page ? (params.page - 1) * (params.limit || 10) : undefined,
      orderBy: params.orderBy || 'createdAt',
      order: params.order || 'DESC'
    };

    return this.articleRepository!.findByUserId(userId, options);
  }

  /**
   * Get single article by ID
   */
  async getArticle(id: string): Promise<Article | null> {
    await this.ensureInitialized();
    return this.articleRepository!.findById(id);
  }

  /**
   * Create a new article
   */
  async createArticle(data: CreateArticleDto): Promise<Article> {
    await this.ensureInitialized();
    
    // Process tags if provided as string array
    let tags: Tag[] = [];
    if (data.tags && data.tags.length > 0) {
      tags = await this.resolveTagsByNames(data.tags, data.userId);
    }

    const articleData: Omit<Article, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: data.userId,
      title: data.title,
      content: data.content ?? null,
      code: data.code ?? null,
      type: data.type || 'snippet',
      language: data.language || 'javascript',
      tags
    };

    return this.articleRepository!.create(articleData);
  }

  /**
   * Update an existing article
   */
  async updateArticle(id: string, data: UpdateArticleDto, userId?: string): Promise<Article> {
    await this.ensureInitialized();
    
    // Process tags if provided
    let tags: Tag[] | undefined;
    if (data.tags !== undefined && userId) {
      tags = await this.resolveTagsByNames(data.tags, userId);
    }

    const updateData: Partial<Article> = {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.code !== undefined && { code: data.code }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.language !== undefined && { language: data.language }),
      ...(tags !== undefined && { tags })
    };

    return this.articleRepository!.update(id, updateData);
  }

  /**
   * Delete an article
   */
  async deleteArticle(id: string): Promise<void> {
    await this.ensureInitialized();
    return this.articleRepository!.delete(id);
  }

  /**
   * Get articles by tag
   */
  async getArticlesByTag(tagId: string, params: PaginationParams = {}): Promise<Article[]> {
    await this.ensureInitialized();
    
    const options: QueryOptions = {
      limit: params.limit,
      offset: params.page ? (params.page - 1) * (params.limit || 10) : undefined,
      orderBy: params.orderBy || 'createdAt',
      order: params.order || 'DESC'
    };

    return this.articleRepository!.findByTag(tagId, options);
  }

  // ============================================================================
  // Tag Operations
  // ============================================================================

  /**
   * Get all tags
   */
  async getTags(params: PaginationParams = {}): Promise<Tag[]> {
    await this.ensureInitialized();
    
    const options: QueryOptions = {
      limit: params.limit,
      offset: params.page ? (params.page - 1) * (params.limit || 10) : undefined,
      orderBy: params.orderBy || 'name',
      order: params.order || 'ASC'
    };

    return this.tagRepository!.findAll(options);
  }

  /**
   * Get tags by user ID
   */
  async getTagsByUserId(userId: string, params: PaginationParams = {}): Promise<Tag[]> {
    await this.ensureInitialized();
    
    const options: QueryOptions = {
      limit: params.limit,
      offset: params.page ? (params.page - 1) * (params.limit || 10) : undefined,
      orderBy: params.orderBy || 'name',
      order: params.order || 'ASC'
    };

    return this.tagRepository!.findByUserId(userId, options);
  }

  /**
   * Get single tag by ID
   */
  async getTag(id: string): Promise<Tag | null> {
    await this.ensureInitialized();
    return this.tagRepository!.findById(id);
  }

  /**
   * Create a new tag
   */
  async createTag(name: string, userId: string, color?: string): Promise<Tag> {
    await this.ensureInitialized();
    return this.tagRepository!.findOrCreate(name, userId, color);
  }

  /**
   * Delete a tag
   */
  async deleteTag(id: string): Promise<void> {
    await this.ensureInitialized();
    return this.tagRepository!.delete(id);
  }

  // ============================================================================
  // Search Operations
  // ============================================================================

  /**
   * Search articles
   */
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    await this.ensureInitialized();
    return this.searchEngine!.search(query, options);
  }

  /**
   * Reindex all articles for search
   */
  async reindexSearch(userId?: string): Promise<void> {
    await this.ensureInitialized();
    
    const articles = userId 
      ? await this.articleRepository!.findByUserId(userId)
      : await this.articleRepository!.findAll();

    const documents = articles.map(article => ({
      id: article.id,
      title: article.title,
      content: article.content || '',
      code: article.code || '',
      tags: article.tags?.map(t => t.name) || []
    }));

    await this.searchEngine!.reindex(documents);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Resolve tag names to Tag objects, creating new tags if needed
   */
  private async resolveTagsByNames(tagNames: string[], userId: string): Promise<Tag[]> {
    const tags: Tag[] = [];
    
    for (const name of tagNames) {
      const tag = await this.tagRepository!.findOrCreate(name, userId);
      tags.push(tag);
    }
    
    return tags;
  }

  /**
   * Ensure the adapter is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Get adapter status for debugging
   */
  getStatus(): {
    initialized: boolean;
    mode: string;
    environment: string;
  } {
    return {
      initialized: this.initialized,
      mode: this.isBrowserMode() ? 'browser' : 'api',
      environment: EnvironmentDetector.getEnvironmentName()
    };
  }

  /**
   * Reset the adapter (useful for testing)
   */
  static reset(): void {
    if (DataAdapter.instance) {
      DataAdapter.instance.initialized = false;
      DataAdapter.instance.articleRepository = null;
      DataAdapter.instance.tagRepository = null;
      DataAdapter.instance.searchEngine = null;
    }
    DataAdapter.instance = null;
    RepositoryFactory.clearCache();
  }
}

// Export singleton instance getter
export const getDataAdapter = () => DataAdapter.getInstance();

// Export convenience functions
export const initializeDataAdapter = () => DataAdapter.getInstance().initialize();
export const isBrowserMode = () => DataAdapter.getInstance().isBrowserMode();
export const isApiMode = () => DataAdapter.getInstance().isApiMode();
