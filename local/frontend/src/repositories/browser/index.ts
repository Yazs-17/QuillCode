/**
 * Browser Repository Module
 * 
 * Exports all browser-based (IndexedDB) repository implementations.
 */

export { BrowserArticleRepository } from './articleRepository';
export { BrowserTagRepository } from './tagRepository';
export { BrowserUserRepository } from './userRepository';

// Database utilities
export {
  initDatabase,
  getDatabase,
  closeDatabase,
  deleteDatabase,
  generateUUID,
  STORES,
  StorageError,
  StorageErrorCode
} from './db';
