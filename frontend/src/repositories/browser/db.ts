/**
 * IndexedDB Database Manager
 * 
 * Provides initialization and management of IndexedDB for browser-based storage.
 * Creates and manages object stores for articles, tags, articleTags, and settings.
 * 
 * @module repositories/browser/db
 */

// ============================================================================
// Database Configuration
// ============================================================================

const DB_NAME = 'QuillCodeDB';
const DB_VERSION = 1;

/**
 * Object store names
 */
export const STORES = {
  ARTICLES: 'articles',
  TAGS: 'tags',
  ARTICLE_TAGS: 'articleTags',
  SETTINGS: 'settings',
  USERS: 'users'
} as const;

/**
 * Database schema definition
 */
const DB_SCHEMA = {
  name: DB_NAME,
  version: DB_VERSION,
  stores: {
    [STORES.ARTICLES]: {
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId', unique: false },
        { name: 'type', keyPath: 'type', unique: false },
        { name: 'createdAt', keyPath: 'createdAt', unique: false },
        { name: 'updatedAt', keyPath: 'updatedAt', unique: false }
      ]
    },
    [STORES.TAGS]: {
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId', unique: false },
        { name: 'name', keyPath: 'name', unique: false },
        { name: 'userId_name', keyPath: ['userId', 'name'], unique: true }
      ]
    },
    [STORES.ARTICLE_TAGS]: {
      keyPath: ['articleId', 'tagId'],
      indexes: [
        { name: 'articleId', keyPath: 'articleId', unique: false },
        { name: 'tagId', keyPath: 'tagId', unique: false }
      ]
    },
    [STORES.SETTINGS]: {
      keyPath: 'key'
    },
    [STORES.USERS]: {
      keyPath: 'id',
      indexes: [
        { name: 'username', keyPath: 'username', unique: true },
        { name: 'email', keyPath: 'email', unique: true }
      ]
    }
  }
};

// ============================================================================
// Error Types
// ============================================================================

/**
 * Storage error codes
 */
export enum StorageErrorCode {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  NOT_FOUND = 'NOT_FOUND',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED'
}

/**
 * Custom storage error class
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public code: StorageErrorCode,
    public cause?: Error
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

// ============================================================================
// Database Manager
// ============================================================================

/**
 * Singleton database instance
 */
let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize the IndexedDB database
 * Creates all required object stores and indexes
 * 
 * @returns Promise resolving to the database instance
 * @throws StorageError if initialization fails
 */
export async function initDatabase(): Promise<IDBDatabase> {
  // Return existing instance if available
  if (dbInstance) {
    return dbInstance;
  }

  // Return existing initialization promise if in progress
  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = new Promise<IDBDatabase>((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_SCHEMA.name, DB_SCHEMA.version);

      request.onerror = () => {
        dbInitPromise = null;
        reject(new StorageError(
          'Failed to open database',
          StorageErrorCode.CONNECTION_FAILED,
          request.error as Error
        ));
      };

      request.onsuccess = () => {
        dbInstance = request.result;
        
        // Handle connection close
        dbInstance.onclose = () => {
          dbInstance = null;
          dbInitPromise = null;
        };

        resolve(dbInstance);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        createObjectStores(db);
      };
    } catch (error) {
      dbInitPromise = null;
      reject(new StorageError(
        'Failed to initialize database',
        StorageErrorCode.INITIALIZATION_FAILED,
        error as Error
      ));
    }
  });

  return dbInitPromise;
}

/**
 * Create all object stores and indexes
 */
function createObjectStores(db: IDBDatabase): void {
  // Create articles store
  if (!db.objectStoreNames.contains(STORES.ARTICLES)) {
    const articlesStore = db.createObjectStore(STORES.ARTICLES, {
      keyPath: DB_SCHEMA.stores[STORES.ARTICLES].keyPath
    });
    DB_SCHEMA.stores[STORES.ARTICLES].indexes.forEach(index => {
      articlesStore.createIndex(index.name, index.keyPath, { unique: index.unique });
    });
  }

  // Create tags store
  if (!db.objectStoreNames.contains(STORES.TAGS)) {
    const tagsStore = db.createObjectStore(STORES.TAGS, {
      keyPath: DB_SCHEMA.stores[STORES.TAGS].keyPath
    });
    DB_SCHEMA.stores[STORES.TAGS].indexes.forEach(index => {
      tagsStore.createIndex(index.name, index.keyPath, { unique: index.unique });
    });
  }

  // Create articleTags store (composite key)
  if (!db.objectStoreNames.contains(STORES.ARTICLE_TAGS)) {
    const articleTagsStore = db.createObjectStore(STORES.ARTICLE_TAGS, {
      keyPath: DB_SCHEMA.stores[STORES.ARTICLE_TAGS].keyPath
    });
    DB_SCHEMA.stores[STORES.ARTICLE_TAGS].indexes.forEach(index => {
      articleTagsStore.createIndex(index.name, index.keyPath, { unique: index.unique });
    });
  }

  // Create settings store
  if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
    db.createObjectStore(STORES.SETTINGS, {
      keyPath: DB_SCHEMA.stores[STORES.SETTINGS].keyPath
    });
  }

  // Create users store
  if (!db.objectStoreNames.contains(STORES.USERS)) {
    const usersStore = db.createObjectStore(STORES.USERS, {
      keyPath: DB_SCHEMA.stores[STORES.USERS].keyPath
    });
    DB_SCHEMA.stores[STORES.USERS].indexes.forEach(index => {
      usersStore.createIndex(index.name, index.keyPath, { unique: index.unique });
    });
  }
}

/**
 * Get the database instance, initializing if necessary
 * 
 * @returns Promise resolving to the database instance
 */
export async function getDatabase(): Promise<IDBDatabase> {
  return initDatabase();
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
  dbInitPromise = null;
}

/**
 * Reset the database singleton state
 * Used for testing to ensure clean state between tests
 */
export function resetDatabaseState(): void {
  if (dbInstance) {
    dbInstance.close();
  }
  dbInstance = null;
  dbInitPromise = null;
}

/**
 * Delete the entire database
 * Useful for testing or resetting user data
 * 
 * @returns Promise that resolves when database is deleted
 */
export async function deleteDatabase(): Promise<void> {
  resetDatabaseState();
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new StorageError(
      'Failed to delete database',
      StorageErrorCode.CONNECTION_FAILED,
      request.error as Error
    ));
  });
}

// ============================================================================
// Transaction Helpers
// ============================================================================

/**
 * Execute a read-only transaction
 * 
 * @param storeName - Name of the object store
 * @param operation - Function to execute within the transaction
 * @returns Promise resolving to the operation result
 */
export async function readTransaction<T>(
  storeName: string,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await getDatabase();
  
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = operation(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new StorageError(
        'Read transaction failed',
        StorageErrorCode.TRANSACTION_FAILED,
        request.error as Error
      ));
    } catch (error) {
      reject(new StorageError(
        'Failed to create read transaction',
        StorageErrorCode.TRANSACTION_FAILED,
        error as Error
      ));
    }
  });
}

/**
 * Execute a read-write transaction
 * 
 * @param storeName - Name of the object store
 * @param operation - Function to execute within the transaction
 * @returns Promise resolving to the operation result
 */
export async function writeTransaction<T>(
  storeName: string,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await getDatabase();
  
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = operation(store);

      request.onsuccess = () => resolve(request.result);
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
            'Data constraint violation',
            StorageErrorCode.CONSTRAINT_VIOLATION,
            error
          ));
        } else {
          reject(new StorageError(
            'Write transaction failed',
            StorageErrorCode.TRANSACTION_FAILED,
            error as Error
          ));
        }
      };
    } catch (error) {
      reject(new StorageError(
        'Failed to create write transaction',
        StorageErrorCode.TRANSACTION_FAILED,
        error as Error
      ));
    }
  });
}

/**
 * Execute a multi-store transaction
 * 
 * @param storeNames - Names of the object stores
 * @param mode - Transaction mode
 * @param operation - Function to execute within the transaction
 * @returns Promise resolving when transaction completes
 */
export async function multiStoreTransaction(
  storeNames: string[],
  mode: IDBTransactionMode,
  operation: (stores: Map<string, IDBObjectStore>, transaction: IDBTransaction) => void
): Promise<void> {
  const db = await getDatabase();
  
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeNames, mode);
      const stores = new Map<string, IDBObjectStore>();
      
      storeNames.forEach(name => {
        stores.set(name, transaction.objectStore(name));
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => {
        const error = transaction.error;
        if (error?.name === 'QuotaExceededError') {
          reject(new StorageError(
            '浏览器存储空间不足，请导出数据或清理空间',
            StorageErrorCode.QUOTA_EXCEEDED,
            error
          ));
        } else {
          reject(new StorageError(
            'Multi-store transaction failed',
            StorageErrorCode.TRANSACTION_FAILED,
            error as Error
          ));
        }
      };
      transaction.onabort = () => reject(new StorageError(
        'Transaction aborted',
        StorageErrorCode.TRANSACTION_FAILED,
        transaction.error as Error
      ));

      operation(stores, transaction);
    } catch (error) {
      reject(new StorageError(
        'Failed to create multi-store transaction',
        StorageErrorCode.TRANSACTION_FAILED,
        error as Error
      ));
    }
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a UUID v4
 * 
 * @returns A new UUID string
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get all records from an object store
 * 
 * @param storeName - Name of the object store
 * @returns Promise resolving to array of all records
 */
export async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  return readTransaction<T[]>(storeName, (store) => store.getAll());
}

/**
 * Get a record by key from an object store
 * 
 * @param storeName - Name of the object store
 * @param key - The key to look up
 * @returns Promise resolving to the record or undefined
 */
export async function getByKey<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  return readTransaction<T | undefined>(storeName, (store) => store.get(key));
}

/**
 * Get records by index
 * 
 * @param storeName - Name of the object store
 * @param indexName - Name of the index
 * @param key - The key to look up in the index
 * @returns Promise resolving to array of matching records
 */
export async function getByIndex<T>(
  storeName: string,
  indexName: string,
  key: IDBValidKey
): Promise<T[]> {
  const db = await getDatabase();
  
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new StorageError(
        'Index query failed',
        StorageErrorCode.TRANSACTION_FAILED,
        request.error as Error
      ));
    } catch (error) {
      reject(new StorageError(
        'Failed to query by index',
        StorageErrorCode.TRANSACTION_FAILED,
        error as Error
      ));
    }
  });
}

/**
 * Add a record to an object store
 * 
 * @param storeName - Name of the object store
 * @param record - The record to add
 * @returns Promise resolving to the key of the added record
 */
export async function addToStore<T>(storeName: string, record: T): Promise<IDBValidKey> {
  return writeTransaction<IDBValidKey>(storeName, (store) => store.add(record));
}

/**
 * Put (add or update) a record in an object store
 * 
 * @param storeName - Name of the object store
 * @param record - The record to put
 * @returns Promise resolving to the key of the record
 */
export async function putInStore<T>(storeName: string, record: T): Promise<IDBValidKey> {
  return writeTransaction<IDBValidKey>(storeName, (store) => store.put(record));
}

/**
 * Delete a record from an object store
 * 
 * @param storeName - Name of the object store
 * @param key - The key of the record to delete
 * @returns Promise resolving when deletion is complete
 */
export async function deleteFromStore(storeName: string, key: IDBValidKey): Promise<void> {
  await writeTransaction<undefined>(storeName, (store) => store.delete(key));
}

/**
 * Count records in an object store
 * 
 * @param storeName - Name of the object store
 * @param key - Optional key or key range to count
 * @returns Promise resolving to the count
 */
export async function countInStore(storeName: string, key?: IDBValidKey | IDBKeyRange): Promise<number> {
  return readTransaction<number>(storeName, (store) => 
    key ? store.count(key) : store.count()
  );
}

/**
 * Clear all records from an object store
 * 
 * @param storeName - Name of the object store
 * @returns Promise resolving when store is cleared
 */
export async function clearStore(storeName: string): Promise<void> {
  await writeTransaction<undefined>(storeName, (store) => store.clear());
}
