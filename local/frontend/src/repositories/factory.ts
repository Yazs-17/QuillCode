/**
 * Repository Factory Module
 * 
 * Factory for creating repository instances based on the runtime environment.
 * Automatically selects the appropriate storage backend (IndexedDB for browser,
 * SQLite for local/desktop).
 * 
 * @module repositories/factory
 */

import { 
  EnvironmentDetector, 
  RuntimeEnvironment 
} from '../utils/environment';
import type { 
  ArticleRepository, 
  TagRepository, 
  UserRepository,
  SearchEngine 
} from './types';

/**
 * Repository instances cache
 */
interface RepositoryCache {
  articleRepository: ArticleRepository | null;
  tagRepository: TagRepository | null;
  userRepository: UserRepository | null;
  searchEngine: SearchEngine | null;
}

/**
 * Repository Factory
 * 
 * Creates and caches repository instances based on the detected runtime environment.
 * Uses singleton pattern to ensure only one instance of each repository exists.
 */
export class RepositoryFactory {
  private static cache: RepositoryCache = {
    articleRepository: null,
    tagRepository: null,
    userRepository: null,
    searchEngine: null
  };

  private static initialized = false;

  /**
   * Initialize the factory
   * This should be called once at application startup
   */
  static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const env = EnvironmentDetector.detect();
    console.log(`[RepositoryFactory] Initializing for environment: ${env}`);

    // Pre-create repositories based on environment
    await this.createArticleRepository();
    await this.createTagRepository();

    this.initialized = true;
    console.log('[RepositoryFactory] Initialization complete');
  }

  /**
   * Create or get cached ArticleRepository instance
   */
  static async createArticleRepository(): Promise<ArticleRepository> {
    if (this.cache.articleRepository) {
      return this.cache.articleRepository;
    }

    const env = EnvironmentDetector.detect();

    switch (env) {
      case RuntimeEnvironment.BROWSER_ONLINE:
      case RuntimeEnvironment.BROWSER_LOCAL:
        // Lazy load browser repository to avoid bundling unused code
        const { BrowserArticleRepository } = await import('./browser/articleRepository');
        this.cache.articleRepository = new BrowserArticleRepository();
        break;

      case RuntimeEnvironment.ELECTRON:
      case RuntimeEnvironment.DOCKER:
        // For Electron/Docker, we'll use API-based repository
        // This will be implemented in a later task
        const { ApiArticleRepository } = await import('./api/articleRepository');
        this.cache.articleRepository = new ApiArticleRepository();
        break;

      default:
        // Fallback to browser repository
        const { BrowserArticleRepository: FallbackRepo } = await import('./browser/articleRepository');
        this.cache.articleRepository = new FallbackRepo();
    }

    return this.cache.articleRepository;
  }

  /**
   * Create or get cached TagRepository instance
   */
  static async createTagRepository(): Promise<TagRepository> {
    if (this.cache.tagRepository) {
      return this.cache.tagRepository;
    }

    const env = EnvironmentDetector.detect();

    switch (env) {
      case RuntimeEnvironment.BROWSER_ONLINE:
      case RuntimeEnvironment.BROWSER_LOCAL:
        const { BrowserTagRepository } = await import('./browser/tagRepository');
        this.cache.tagRepository = new BrowserTagRepository();
        break;

      case RuntimeEnvironment.ELECTRON:
      case RuntimeEnvironment.DOCKER:
        const { ApiTagRepository } = await import('./api/tagRepository');
        this.cache.tagRepository = new ApiTagRepository();
        break;

      default:
        const { BrowserTagRepository: FallbackRepo } = await import('./browser/tagRepository');
        this.cache.tagRepository = new FallbackRepo();
    }

    return this.cache.tagRepository;
  }

  /**
   * Create or get cached UserRepository instance
   */
  static async createUserRepository(): Promise<UserRepository> {
    if (this.cache.userRepository) {
      return this.cache.userRepository;
    }

    const env = EnvironmentDetector.detect();

    switch (env) {
      case RuntimeEnvironment.BROWSER_ONLINE:
      case RuntimeEnvironment.BROWSER_LOCAL:
        const { BrowserUserRepository } = await import('./browser/userRepository');
        this.cache.userRepository = new BrowserUserRepository();
        break;

      case RuntimeEnvironment.ELECTRON:
      case RuntimeEnvironment.DOCKER:
        const { ApiUserRepository } = await import('./api/userRepository');
        this.cache.userRepository = new ApiUserRepository();
        break;

      default:
        const { BrowserUserRepository: FallbackRepo } = await import('./browser/userRepository');
        this.cache.userRepository = new FallbackRepo();
    }

    return this.cache.userRepository;
  }

  /**
   * Create or get cached SearchEngine instance
   */
  static async createSearchEngine(): Promise<SearchEngine> {
    if (this.cache.searchEngine) {
      return this.cache.searchEngine;
    }

    const env = EnvironmentDetector.detect();

    switch (env) {
      case RuntimeEnvironment.BROWSER_ONLINE:
      case RuntimeEnvironment.BROWSER_LOCAL:
        const { BrowserSearchEngine } = await import('../search/browserSearchEngine');
        this.cache.searchEngine = new BrowserSearchEngine();
        break;

      case RuntimeEnvironment.ELECTRON:
      case RuntimeEnvironment.DOCKER:
        // For local mode, search is handled by the backend
        const { ApiSearchEngine } = await import('../search/apiSearchEngine');
        this.cache.searchEngine = new ApiSearchEngine();
        break;

      default:
        const { BrowserSearchEngine: FallbackEngine } = await import('../search/browserSearchEngine');
        this.cache.searchEngine = new FallbackEngine();
    }

    return this.cache.searchEngine;
  }

  /**
   * Get the current runtime environment
   */
  static getEnvironment(): RuntimeEnvironment {
    return EnvironmentDetector.detect();
  }

  /**
   * Check if using browser-based storage
   */
  static isBrowserStorage(): boolean {
    const env = EnvironmentDetector.detect();
    return env === RuntimeEnvironment.BROWSER_ONLINE || 
           env === RuntimeEnvironment.BROWSER_LOCAL;
  }

  /**
   * Check if using API-based storage
   */
  static isApiStorage(): boolean {
    const env = EnvironmentDetector.detect();
    return env === RuntimeEnvironment.ELECTRON || 
           env === RuntimeEnvironment.DOCKER;
  }

  /**
   * Clear all cached repository instances
   * Useful for testing or when switching environments
   */
  static clearCache(): void {
    this.cache = {
      articleRepository: null,
      tagRepository: null,
      userRepository: null,
      searchEngine: null
    };
    this.initialized = false;
    console.log('[RepositoryFactory] Cache cleared');
  }

  /**
   * Get factory status for debugging
   */
  static getStatus(): {
    environment: RuntimeEnvironment;
    initialized: boolean;
    cachedRepositories: string[];
  } {
    const cachedRepositories: string[] = [];
    
    if (this.cache.articleRepository) cachedRepositories.push('articleRepository');
    if (this.cache.tagRepository) cachedRepositories.push('tagRepository');
    if (this.cache.userRepository) cachedRepositories.push('userRepository');
    if (this.cache.searchEngine) cachedRepositories.push('searchEngine');

    return {
      environment: EnvironmentDetector.detect(),
      initialized: this.initialized,
      cachedRepositories
    };
  }
}

// Export convenience functions
export const getArticleRepository = () => RepositoryFactory.createArticleRepository();
export const getTagRepository = () => RepositoryFactory.createTagRepository();
export const getUserRepository = () => RepositoryFactory.createUserRepository();
export const getSearchEngine = () => RepositoryFactory.createSearchEngine();
export const initializeRepositories = () => RepositoryFactory.initialize();
