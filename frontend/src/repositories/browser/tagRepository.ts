/**
 * Browser Tag Repository
 * 
 * IndexedDB-based implementation of TagRepository for browser environments.
 * Provides full CRUD operations with IndexedDB persistence.
 * 
 * @module repositories/browser/tagRepository
 */

import type { 
  Tag, 
  TagRepository, 
  QueryOptions 
} from '../types';
import {
  getDatabase,
  generateUUID,
  STORES,
  StorageError,
  StorageErrorCode,
  getByIndex
} from './db';

/**
 * Default tag color
 */
const DEFAULT_TAG_COLOR = '#3b82f6';

/**
 * Browser-based Tag Repository using IndexedDB
 * 
 * @implements {TagRepository}
 */
export class BrowserTagRepository implements TagRepository {
  constructor() {
    // Initialize database on construction
    this.init();
  }

  private async init(): Promise<void> {
    await getDatabase();
  }

  /**
   * Find all tags with optional query options
   */
  async findAll(options?: QueryOptions): Promise<Tag[]> {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.TAGS, 'readonly');
      const store = transaction.objectStore(STORES.TAGS);
      const request = store.getAll();

      request.onsuccess = () => {
        let tags = request.result as Tag[];
        
        // Apply sorting
        if (options?.orderBy) {
          const order = options.order === 'ASC' ? 1 : -1;
          tags.sort((a, b) => {
            const aVal = a[options.orderBy as keyof Tag];
            const bVal = b[options.orderBy as keyof Tag];
            if (aVal < bVal) return -1 * order;
            if (aVal > bVal) return 1 * order;
            return 0;
          });
        }

        // Apply pagination
        if (options?.offset !== undefined) {
          tags = tags.slice(options.offset);
        }
        if (options?.limit !== undefined) {
          tags = tags.slice(0, options.limit);
        }

        resolve(tags);
      };

      request.onerror = () => reject(new StorageError(
        'Failed to fetch tags',
        StorageErrorCode.TRANSACTION_FAILED,
        request.error as Error
      ));
    });
  }

  /**
   * Find tag by ID
   */
  async findById(id: string): Promise<Tag | null> {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.TAGS, 'readonly');
      const store = transaction.objectStore(STORES.TAGS);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => reject(new StorageError(
        'Failed to fetch tag',
        StorageErrorCode.TRANSACTION_FAILED,
        request.error as Error
      ));
    });
  }

  /**
   * Find tags by criteria
   */
  async findBy(criteria: Partial<Tag>): Promise<Tag[]> {
    const allTags = await this.findAll();
    
    return allTags.filter(tag => {
      return Object.entries(criteria).every(([key, value]) => {
        return tag[key as keyof Tag] === value;
      });
    });
  }

  /**
   * Create a new tag
   */
  async create(entity: Omit<Tag, 'id' | 'createdAt'>): Promise<Tag> {
    const db = await getDatabase();
    const now = new Date();
    
    const newTag: Tag = {
      ...entity,
      id: generateUUID(),
      color: entity.color || DEFAULT_TAG_COLOR,
      createdAt: now
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.TAGS, 'readwrite');
      const store = transaction.objectStore(STORES.TAGS);
      const request = store.add(newTag);

      request.onsuccess = () => resolve(newTag);
      request.onerror = () => {
        const error = request.error;
        if (error?.name === 'QuotaExceededError') {
          reject(new StorageError(
            '浏览器存储空间不足，请导出数据或清理空间',
            StorageErrorCode.QUOTA_EXCEEDED,
            error
          ));
        } else if (error?.name === 'ConstraintError') {
          reject(new StorageError(
            'Tag with this name already exists for this user',
            StorageErrorCode.CONSTRAINT_VIOLATION,
            error
          ));
        } else {
          reject(new StorageError(
            'Failed to create tag',
            StorageErrorCode.TRANSACTION_FAILED,
            error as Error
          ));
        }
      };
    });
  }

  /**
   * Update an existing tag
   */
  async update(id: string, entity: Partial<Tag>): Promise<Tag> {
    const existing = await this.findById(id);
    
    if (!existing) {
      throw new StorageError(
        `Tag with id ${id} not found`,
        StorageErrorCode.NOT_FOUND
      );
    }

    const db = await getDatabase();
    const updatedTag: Tag = {
      ...existing,
      ...entity,
      id, // Ensure ID doesn't change
      createdAt: existing.createdAt // Preserve creation time
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.TAGS, 'readwrite');
      const store = transaction.objectStore(STORES.TAGS);
      const request = store.put(updatedTag);

      request.onsuccess = () => resolve(updatedTag);
      request.onerror = () => {
        const error = request.error;
        if (error?.name === 'ConstraintError') {
          reject(new StorageError(
            'Tag with this name already exists for this user',
            StorageErrorCode.CONSTRAINT_VIOLATION,
            error
          ));
        } else {
          reject(new StorageError(
            'Failed to update tag',
            StorageErrorCode.TRANSACTION_FAILED,
            error as Error
          ));
        }
      };
    });
  }

  /**
   * Delete a tag by ID
   * Also removes all article-tag relationships
   */
  async delete(id: string): Promise<void> {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.TAGS, STORES.ARTICLE_TAGS], 'readwrite');
      const tagsStore = transaction.objectStore(STORES.TAGS);
      const articleTagsStore = transaction.objectStore(STORES.ARTICLE_TAGS);

      // Delete tag
      tagsStore.delete(id);

      // Delete article-tag relationships
      const index = articleTagsStore.index('tagId');
      const cursorRequest = index.openCursor(IDBKeyRange.only(id));
      
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new StorageError(
        'Failed to delete tag',
        StorageErrorCode.TRANSACTION_FAILED,
        transaction.error as Error
      ));
    });
  }

  /**
   * Count tags matching criteria
   */
  async count(criteria?: Partial<Tag>): Promise<number> {
    if (!criteria || Object.keys(criteria).length === 0) {
      const db = await getDatabase();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.TAGS, 'readonly');
        const store = transaction.objectStore(STORES.TAGS);
        const request = store.count();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new StorageError(
          'Failed to count tags',
          StorageErrorCode.TRANSACTION_FAILED,
          request.error as Error
        ));
      });
    }

    const tags = await this.findBy(criteria);
    return tags.length;
  }

  /**
   * Find tags by user ID
   */
  async findByUserId(userId: string, options?: QueryOptions): Promise<Tag[]> {
    let tags = await getByIndex<Tag>(STORES.TAGS, 'userId', userId);

    // Apply sorting
    if (options?.orderBy) {
      const order = options.order === 'ASC' ? 1 : -1;
      tags.sort((a, b) => {
        const aVal = a[options.orderBy as keyof Tag];
        const bVal = b[options.orderBy as keyof Tag];
        if (aVal < bVal) return -1 * order;
        if (aVal > bVal) return 1 * order;
        return 0;
      });
    }

    // Apply pagination
    if (options?.offset !== undefined) {
      tags = tags.slice(options.offset);
    }
    if (options?.limit !== undefined) {
      tags = tags.slice(0, options.limit);
    }

    return tags;
  }

  /**
   * Find tag by name for a specific user
   */
  async findByName(name: string, userId: string): Promise<Tag | null> {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.TAGS, 'readonly');
      const store = transaction.objectStore(STORES.TAGS);
      
      // Use the compound index for userId_name
      const index = store.index('userId_name');
      const request = index.get([userId, name]);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => reject(new StorageError(
        'Failed to find tag by name',
        StorageErrorCode.TRANSACTION_FAILED,
        request.error as Error
      ));
    });
  }

  /**
   * Find or create a tag by name
   * If a tag with the given name exists for the user, return it.
   * Otherwise, create a new tag with the given name and color.
   */
  async findOrCreate(name: string, userId: string, color?: string): Promise<Tag> {
    // Try to find existing tag
    const existing = await this.findByName(name, userId);
    
    if (existing) {
      return existing;
    }

    // Create new tag
    return this.create({
      name,
      userId,
      color: color || DEFAULT_TAG_COLOR
    });
  }
}
