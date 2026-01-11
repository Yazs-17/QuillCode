/**
 * Test Setup
 * 
 * Configures the test environment with fake-indexeddb for browser storage tests.
 */

import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, afterEach } from 'vitest';
import { resetSearchEngine } from '../search/searchIndexManager';

// Reset IndexedDB before each test to ensure isolation
beforeEach(() => {
  // Create a fresh IndexedDB instance for each test
  globalThis.indexedDB = new IDBFactory();
  // Reset search engine to avoid state leakage between tests
  resetSearchEngine();
});

// Clean up after each test
afterEach(() => {
  // Reset search engine to prevent async vacuuming errors
  resetSearchEngine();
});
