/**
 * Browser Article Repository
 * 
 * IndexedDB-based implementation of ArticleRepository for browser environments.
 * Provides full CRUD operations with IndexedDB persistence.
 * Automatically syncs with the search index on create/update/delete operations.
 * 
 * @module repositories/browser/articleRepository
 */

import type { 
  Article, 
  ArticleRepository, 
  QueryOptions, 
  SearchResult,
  SearchOptions,
  Tag,
  ArticleTag
} from '../types';
import {
  getDatabase,
  generateUUID,
  STORES,
  StorageError,
  StorageErrorCode,
  getByIndex
} from './db';
import { indexArticle, removeArticleFromIndex, searchArticles } from '../../search';

/**
 * Browser-based Article Repository using IndexedDB
 * 
 * @implements {ArticleRepository}
 */
export class BrowserArticleRepository implements ArticleRepository {
  constructor() {
    // Initialize database on construction
    this.init();
  }

  private async init(): Promise<void> {
    await getDatabase();
  }

  /**
   * Find all articles with optional query options
   */
  async findAll(options?: QueryOptions): Promise<Article[]> {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ARTICLES, STORES.ARTICLE_TAGS, STORES.TAGS], 'readonly');
      const articlesStore = transaction.objectStore(STORES.ARTICLES);
      const request = articlesStore.getAll();

      request.onsuccess = async () => {
        try {
          let articles = request.result as Article[];
          
          // Apply sorting
          if (options?.orderBy) {
            const order = options.order === 'ASC' ? 1 : -1;
            articles.sort((a, b) => {
              const aVal = a[options.orderBy as keyof Article];
              const bVal = b[options.orderBy as keyof Article];
              if (aVal == null && bVal == null) return 0;
              if (aVal == null) return 1 * order;
              if (bVal == null) return -1 * order;
              if (aVal < bVal) return -1 * order;
              if (aVal > bVal) return 1 * order;
              return 0;
            });
          }

          // Apply pagination
          if (options?.offset !== undefined) {
            articles = articles.slice(options.offset);
          }
          if (options?.limit !== undefined) {
            articles = articles.slice(0, options.limit);
          }

          // Load tags for each article
          const articlesWithTags = await this.loadTagsForArticles(articles);
          resolve(articlesWithTags);
        } catch (error) {
          reject(error);
        }
      };

      request.onerror = () => reject(new StorageError(
        'Failed to fetch articles',
        StorageErrorCode.TRANSACTION_FAILED,
        request.error as Error
      ));
    });
  }


  /**
   * Find article by ID
   */
  async findById(id: string): Promise<Article | null> {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.ARTICLES, 'readonly');
      const store = transaction.objectStore(STORES.ARTICLES);
      const request = store.get(id);

      request.onsuccess = async () => {
        if (!request.result) {
          resolve(null);
          return;
        }
        
        try {
          const articlesWithTags = await this.loadTagsForArticles([request.result]);
          resolve(articlesWithTags[0] || null);
        } catch (error) {
          reject(error);
        }
      };

      request.onerror = () => reject(new StorageError(
        'Failed to fetch article',
        StorageErrorCode.TRANSACTION_FAILED,
        request.error as Error
      ));
    });
  }

  /**
   * Find articles by criteria
   */
  async findBy(criteria: Partial<Article>): Promise<Article[]> {
    const allArticles = await this.findAll();
    
    return allArticles.filter(article => {
      return Object.entries(criteria).every(([key, value]) => {
        if (key === 'tags') return true; // Skip tags comparison
        return article[key as keyof Article] === value;
      });
    });
  }

  /**
   * Create a new article
   */
  async create(entity: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>): Promise<Article> {
    const db = await getDatabase();
    const now = new Date();
    
    const newArticle: Article = {
      ...entity,
      id: generateUUID(),
      tags: entity.tags || [],
      createdAt: now,
      updatedAt: now
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ARTICLES, STORES.ARTICLE_TAGS], 'readwrite');
      const articlesStore = transaction.objectStore(STORES.ARTICLES);
      const articleTagsStore = transaction.objectStore(STORES.ARTICLE_TAGS);

      // Store article without tags array (tags are stored in articleTags)
      const articleToStore = { ...newArticle, tags: [] };
      const articleRequest = articlesStore.add(articleToStore);

      articleRequest.onerror = () => {
        const error = articleRequest.error;
        if (error?.name === 'QuotaExceededError') {
          reject(new StorageError(
            '浏览器存储空间不足，请导出数据或清理空间',
            StorageErrorCode.QUOTA_EXCEEDED,
            error
          ));
        } else {
          reject(new StorageError(
            'Failed to create article',
            StorageErrorCode.TRANSACTION_FAILED,
            error as Error
          ));
        }
      };

      // Add article-tag relationships
      if (newArticle.tags && newArticle.tags.length > 0) {
        newArticle.tags.forEach(tag => {
          const articleTag: ArticleTag = {
            articleId: newArticle.id,
            tagId: tag.id
          };
          articleTagsStore.add(articleTag);
        });
      }

      transaction.oncomplete = async () => {
        // Sync with search index after successful creation
        try {
          await indexArticle(newArticle);
        } catch (error) {
          console.warn('Failed to index article in search engine:', error);
        }
        resolve(newArticle);
      };
      transaction.onerror = () => reject(new StorageError(
        'Failed to create article',
        StorageErrorCode.TRANSACTION_FAILED,
        transaction.error as Error
      ));
    });
  }


  /**
   * Update an existing article
   */
  async update(id: string, entity: Partial<Article>): Promise<Article> {
    const existing = await this.findById(id);
    
    if (!existing) {
      throw new StorageError(
        `Article with id ${id} not found`,
        StorageErrorCode.NOT_FOUND
      );
    }

    const db = await getDatabase();
    const updatedArticle: Article = {
      ...existing,
      ...entity,
      id, // Ensure ID doesn't change
      createdAt: existing.createdAt, // Preserve creation time
      updatedAt: new Date()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ARTICLES, STORES.ARTICLE_TAGS], 'readwrite');
      const articlesStore = transaction.objectStore(STORES.ARTICLES);
      const articleTagsStore = transaction.objectStore(STORES.ARTICLE_TAGS);

      // Store article without tags array
      const articleToStore = { ...updatedArticle, tags: [] };
      articlesStore.put(articleToStore);

      // Update article-tag relationships if tags changed
      if (entity.tags !== undefined) {
        // Delete existing relationships
        const index = articleTagsStore.index('articleId');
        const cursorRequest = index.openCursor(IDBKeyRange.only(id));
        
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };

        // Add new relationships
        if (updatedArticle.tags && updatedArticle.tags.length > 0) {
          updatedArticle.tags.forEach(tag => {
            const articleTag: ArticleTag = {
              articleId: id,
              tagId: tag.id
            };
            articleTagsStore.add(articleTag);
          });
        }
      }

      transaction.oncomplete = async () => {
        // Sync with search index after successful update
        try {
          await indexArticle(updatedArticle);
        } catch (error) {
          console.warn('Failed to update article in search engine:', error);
        }
        resolve(updatedArticle);
      };
      transaction.onerror = () => reject(new StorageError(
        'Failed to update article',
        StorageErrorCode.TRANSACTION_FAILED,
        transaction.error as Error
      ));
    });
  }

  /**
   * Delete an article by ID
   */
  async delete(id: string): Promise<void> {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ARTICLES, STORES.ARTICLE_TAGS], 'readwrite');
      const articlesStore = transaction.objectStore(STORES.ARTICLES);
      const articleTagsStore = transaction.objectStore(STORES.ARTICLE_TAGS);

      // Delete article
      articlesStore.delete(id);

      // Delete article-tag relationships
      const index = articleTagsStore.index('articleId');
      const cursorRequest = index.openCursor(IDBKeyRange.only(id));
      
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.oncomplete = async () => {
        // Remove from search index after successful deletion
        try {
          await removeArticleFromIndex(id);
        } catch (error) {
          console.warn('Failed to remove article from search engine:', error);
        }
        resolve();
      };
      transaction.onerror = () => reject(new StorageError(
        'Failed to delete article',
        StorageErrorCode.TRANSACTION_FAILED,
        transaction.error as Error
      ));
    });
  }


  /**
   * Count articles matching criteria
   */
  async count(criteria?: Partial<Article>): Promise<number> {
    if (!criteria || Object.keys(criteria).length === 0) {
      const db = await getDatabase();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.ARTICLES, 'readonly');
        const store = transaction.objectStore(STORES.ARTICLES);
        const request = store.count();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new StorageError(
          'Failed to count articles',
          StorageErrorCode.TRANSACTION_FAILED,
          request.error as Error
        ));
      });
    }

    const articles = await this.findBy(criteria);
    return articles.length;
  }

  /**
   * Find articles by user ID
   */
  async findByUserId(userId: string, options?: QueryOptions): Promise<Article[]> {
    const articles = await getByIndex<Article>(STORES.ARTICLES, 'userId', userId);
    let result = await this.loadTagsForArticles(articles);

    // Apply sorting
    if (options?.orderBy) {
      const order = options.order === 'ASC' ? 1 : -1;
      result.sort((a, b) => {
        const aVal = a[options.orderBy as keyof Article];
        const bVal = b[options.orderBy as keyof Article];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1 * order;
        if (bVal == null) return -1 * order;
        if (aVal < bVal) return -1 * order;
        if (aVal > bVal) return 1 * order;
        return 0;
      });
    }

    // Apply pagination
    if (options?.offset !== undefined) {
      result = result.slice(options.offset);
    }
    if (options?.limit !== undefined) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  /**
   * Find articles by tag ID
   */
  async findByTag(tagId: string, options?: QueryOptions): Promise<Article[]> {
    // Get article IDs from articleTags
    const articleTags = await getByIndex<ArticleTag>(STORES.ARTICLE_TAGS, 'tagId', tagId);
    const articleIds = articleTags.map(at => at.articleId);

    // Fetch articles
    const articles: Article[] = [];
    for (const articleId of articleIds) {
      const article = await this.findById(articleId);
      if (article) {
        articles.push(article);
      }
    }

    let result = articles;

    // Apply sorting
    if (options?.orderBy) {
      const order = options.order === 'ASC' ? 1 : -1;
      result.sort((a, b) => {
        const aVal = a[options.orderBy as keyof Article];
        const bVal = b[options.orderBy as keyof Article];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1 * order;
        if (bVal == null) return -1 * order;
        if (aVal < bVal) return -1 * order;
        if (aVal > bVal) return 1 * order;
        return 0;
      });
    }

    // Apply pagination
    if (options?.offset !== undefined) {
      result = result.slice(options.offset);
    }
    if (options?.limit !== undefined) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  /**
   * Search articles by query string
   * Uses the BrowserSearchEngine for full-text search with MiniSearch.
   */
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    // Use the search engine for full-text search
    return searchArticles(query, options);
  }


  /**
   * Load tags for a list of articles
   */
  private async loadTagsForArticles(articles: Article[]): Promise<Article[]> {
    if (articles.length === 0) return articles;

    const db = await getDatabase();
    
    return new Promise((resolve) => {
      const transaction = db.transaction([STORES.ARTICLE_TAGS, STORES.TAGS], 'readonly');
      const articleTagsStore = transaction.objectStore(STORES.ARTICLE_TAGS);
      const tagsStore = transaction.objectStore(STORES.TAGS);

      const articlesWithTags: Article[] = [];
      let completed = 0;

      articles.forEach((article, index) => {
        const articleTagIndex = articleTagsStore.index('articleId');
        const request = articleTagIndex.getAll(article.id);

        request.onsuccess = () => {
          const articleTags = request.result as ArticleTag[];
          const tagPromises: Promise<Tag | undefined>[] = [];

          articleTags.forEach(at => {
            tagPromises.push(new Promise((res) => {
              const tagRequest = tagsStore.get(at.tagId);
              tagRequest.onsuccess = () => res(tagRequest.result);
              tagRequest.onerror = () => res(undefined);
            }));
          });

          Promise.all(tagPromises).then(tags => {
            articlesWithTags[index] = {
              ...article,
              tags: tags.filter((t): t is Tag => t !== undefined)
            };
            completed++;
            
            if (completed === articles.length) {
              resolve(articlesWithTags);
            }
          });
        };

        request.onerror = () => {
          articlesWithTags[index] = { ...article, tags: [] };
          completed++;
          
          if (completed === articles.length) {
            resolve(articlesWithTags);
          }
        };
      });
    });
  }
}
