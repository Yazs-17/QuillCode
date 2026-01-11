/**
 * API Search Engine
 * 
 * REST API-based implementation of SearchEngine for Electron/Docker environments.
 * This is a placeholder for future implementation.
 * 
 * @module search/apiSearchEngine
 */

import type { 
  SearchEngine, 
  SearchDocument, 
  SearchResult, 
  SearchOptions 
} from '../repositories/types';

/**
 * API-based Search Engine
 * 
 * @implements {SearchEngine}
 */
export class ApiSearchEngine implements SearchEngine {
  constructor() {
    console.log('[ApiSearchEngine] Initialized (placeholder)');
  }

  async index(document: SearchDocument): Promise<void> {
    throw new Error('Not implemented - will be implemented in local version tasks');
  }

  async remove(documentId: string): Promise<void> {
    throw new Error('Not implemented - will be implemented in local version tasks');
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    throw new Error('Not implemented - will be implemented in local version tasks');
  }

  async reindex(documents: SearchDocument[]): Promise<void> {
    throw new Error('Not implemented - will be implemented in local version tasks');
  }
}
