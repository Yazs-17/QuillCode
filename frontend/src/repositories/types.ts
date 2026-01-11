/**
 * Repository Types and Interfaces
 * 
 * This module defines the core interfaces for the DataAdapter pattern,
 * providing a unified data access layer that supports multiple storage backends.
 * 
 * @module repositories/types
 */

// ============================================================================
// Core Entity Types
// ============================================================================

/**
 * Article type enumeration
 */
export type ArticleType = 'algorithm' | 'snippet' | 'html';

/**
 * Article entity interface
 */
export interface Article {
  id: string;
  userId: string;
  title: string;
  content: string | null;
  code: string | null;
  type: ArticleType;
  language: string;
  tags: Tag[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tag entity interface
 */
export interface Tag {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: Date;
}

/**
 * User entity interface
 */
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Article-Tag relationship
 */
export interface ArticleTag {
  articleId: string;
  tagId: string;
}

// ============================================================================
// Query and Result Types
// ============================================================================

/**
 * Query options for repository operations
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  order?: 'ASC' | 'DESC';
}

/**
 * Search result item
 */
export interface SearchResult {
  id: string;
  title: string;
  score: number;
  highlights: {
    title?: string;
    content?: string;
    code?: string;
  };
}

/**
 * Search options
 */
export interface SearchOptions {
  limit?: number;
  offset?: number;
  userId?: string;
  boost?: {
    title?: number;
    content?: number;
    code?: number;
  };
}

/**
 * Search document for indexing
 */
export interface SearchDocument {
  id: string;
  title: string;
  content: string;
  code?: string;
  tags?: string[];
}

// ============================================================================
// DTO Types (Data Transfer Objects)
// ============================================================================

/**
 * Create article DTO
 */
export interface CreateArticleDto {
  userId: string;
  title: string;
  content?: string | null;
  code?: string | null;
  type?: ArticleType;
  language?: string;
  tags?: string[];
}

/**
 * Update article DTO
 */
export interface UpdateArticleDto {
  title?: string;
  content?: string | null;
  code?: string | null;
  type?: ArticleType;
  language?: string;
  tags?: string[];
}

/**
 * Create tag DTO
 */
export interface CreateTagDto {
  name: string;
  color?: string;
  userId: string;
}

/**
 * Update tag DTO
 */
export interface UpdateTagDto {
  name?: string;
  color?: string;
}

// ============================================================================
// Repository Interfaces
// ============================================================================

/**
 * Base repository interface with generic CRUD operations
 * @template T - Entity type
 */
export interface DataRepository<T> {
  /**
   * Find all entities with optional query options
   */
  findAll(options?: QueryOptions): Promise<T[]>;

  /**
   * Find entity by ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find entities by criteria
   */
  findBy(criteria: Partial<T>): Promise<T[]>;

  /**
   * Create a new entity
   */
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;

  /**
   * Update an existing entity
   */
  update(id: string, entity: Partial<T>): Promise<T>;

  /**
   * Delete an entity by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Count entities matching criteria
   */
  count(criteria?: Partial<T>): Promise<number>;
}

/**
 * Article repository interface with article-specific operations
 */
export interface ArticleRepository extends DataRepository<Article> {
  /**
   * Find articles by user ID
   */
  findByUserId(userId: string, options?: QueryOptions): Promise<Article[]>;

  /**
   * Find articles by tag ID
   */
  findByTag(tagId: string, options?: QueryOptions): Promise<Article[]>;

  /**
   * Search articles by query string
   */
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}

/**
 * Tag repository interface with tag-specific operations
 */
export interface TagRepository extends DataRepository<Tag> {
  /**
   * Find tags by user ID
   */
  findByUserId(userId: string, options?: QueryOptions): Promise<Tag[]>;

  /**
   * Find tag by name for a specific user
   */
  findByName(name: string, userId: string): Promise<Tag | null>;

  /**
   * Find or create a tag by name
   */
  findOrCreate(name: string, userId: string, color?: string): Promise<Tag>;
}

/**
 * User repository interface
 */
export interface UserRepository extends DataRepository<User> {
  /**
   * Find user by username
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<User | null>;
}

// ============================================================================
// Search Engine Interface
// ============================================================================

/**
 * Search engine interface for full-text search operations
 */
export interface SearchEngine {
  /**
   * Index a document for searching
   */
  index(document: SearchDocument): Promise<void>;

  /**
   * Remove a document from the index
   */
  remove(documentId: string): Promise<void>;

  /**
   * Search for documents matching the query
   */
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;

  /**
   * Reindex all documents
   */
  reindex(documents: SearchDocument[]): Promise<void>;
}

// ============================================================================
// Export Service Interface
// ============================================================================

/**
 * Import result
 */
export interface ImportResult {
  success: boolean;
  articlesImported: number;
  tagsImported: number;
  errors: string[];
}

/**
 * Export data format
 */
export interface ExportData {
  version: string;
  exportedAt: string;
  articles: Article[];
  tags: Tag[];
}

/**
 * Export service interface
 */
export interface ExportService {
  /**
   * Export all data to JSON format
   */
  exportToJSON(): Promise<Blob>;

  /**
   * Export all articles to Markdown ZIP format
   */
  exportToMarkdown(): Promise<Blob>;

  /**
   * Import data from JSON
   */
  importFromJSON(data: Blob): Promise<ImportResult>;
}

// ============================================================================
// AI Service Types
// ============================================================================

/**
 * AI service mode
 */
export type AIMode = 'byok' | 'ollama' | 'disabled';

/**
 * Chat message
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * AI configuration
 */
export interface AIConfig {
  mode: AIMode;
  endpoint?: string;
  model?: string;
  apiKey?: string;
}

/**
 * AI service interface
 */
export interface AIService {
  /**
   * Check if AI service is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Send chat messages and get response
   */
  chat(messages: ChatMessage[]): Promise<string>;

  /**
   * Stream chat response
   */
  stream(messages: ChatMessage[], onChunk: (chunk: string) => void): Promise<void>;

  /**
   * Get current AI configuration
   */
  getConfig(): AIConfig;
}
