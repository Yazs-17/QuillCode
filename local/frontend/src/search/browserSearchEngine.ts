/**
 * Browser Search Engine
 * 
 * MiniSearch-based implementation of SearchEngine for browser environments.
 * Provides full-text search with configurable field weights and fuzzy matching.
 * 
 * @module search/browserSearchEngine
 */

import MiniSearch from 'minisearch';
import type { 
  SearchEngine, 
  SearchDocument, 
  SearchResult, 
  SearchOptions 
} from '../repositories/types';

/**
 * Default field boost weights
 */
const DEFAULT_BOOST = {
  title: 3,
  content: 2,
  code: 1
};

/**
 * Browser-based Search Engine using MiniSearch
 * 
 * @implements {SearchEngine}
 */
export class BrowserSearchEngine implements SearchEngine {
  private miniSearch: MiniSearch<SearchDocument>;
  private documents: Map<string, SearchDocument>;

  constructor() {
    this.documents = new Map();
    this.miniSearch = new MiniSearch<SearchDocument>({
      fields: ['title', 'content', 'code'],
      storeFields: ['id', 'title'],
      searchOptions: {
        boost: DEFAULT_BOOST,
        fuzzy: 0.2,
        prefix: true
      }
    });
  }

  /**
   * Index a document for searching
   */
  async index(document: SearchDocument): Promise<void> {
    // Remove existing document if it exists (for updates)
    if (this.documents.has(document.id)) {
      this.miniSearch.discard(document.id);
    }
    
    // Store the document
    this.documents.set(document.id, document);
    
    // Add to MiniSearch index
    this.miniSearch.add(document);
  }

  /**
   * Remove a document from the index
   */
  async remove(documentId: string): Promise<void> {
    if (this.documents.has(documentId)) {
      this.miniSearch.discard(documentId);
      this.documents.delete(documentId);
    }
  }

  /**
   * Search for documents matching the query
   */
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchOptions = {
      boost: options?.boost || DEFAULT_BOOST,
      fuzzy: 0.2,
      prefix: true
    };

    const miniSearchResults = this.miniSearch.search(query, searchOptions);

    // Transform results to SearchResult format
    let results: SearchResult[] = miniSearchResults.map(result => {
      const doc = this.documents.get(result.id);
      return {
        id: result.id,
        title: doc?.title || '',
        score: result.score,
        highlights: this.extractHighlights(doc, query)
      };
    });

    // Apply pagination
    if (options?.offset !== undefined) {
      results = results.slice(options.offset);
    }
    if (options?.limit !== undefined) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Reindex all documents
   */
  async reindex(documents: SearchDocument[]): Promise<void> {
    // Clear existing index
    this.miniSearch = new MiniSearch<SearchDocument>({
      fields: ['title', 'content', 'code'],
      storeFields: ['id', 'title'],
      searchOptions: {
        boost: DEFAULT_BOOST,
        fuzzy: 0.2,
        prefix: true
      }
    });
    this.documents.clear();

    // Add all documents
    for (const doc of documents) {
      this.documents.set(doc.id, doc);
    }
    this.miniSearch.addAll(documents);
  }

  /**
   * Extract highlighted snippets from document matching the query
   */
  private extractHighlights(
    doc: SearchDocument | undefined, 
    query: string
  ): SearchResult['highlights'] {
    if (!doc) return {};

    const highlights: SearchResult['highlights'] = {};
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 0);

    // Check title
    if (doc.title && this.containsAnyTerm(doc.title, queryTerms)) {
      highlights.title = this.highlightTerms(doc.title, queryTerms);
    }

    // Check content
    if (doc.content && this.containsAnyTerm(doc.content, queryTerms)) {
      highlights.content = this.highlightTerms(doc.content, queryTerms);
    }

    // Check code
    if (doc.code && this.containsAnyTerm(doc.code, queryTerms)) {
      highlights.code = this.highlightTerms(doc.code, queryTerms);
    }

    return highlights;
  }

  /**
   * Check if text contains any of the query terms
   */
  private containsAnyTerm(text: string, terms: string[]): boolean {
    const textLower = text.toLowerCase();
    return terms.some(term => textLower.includes(term));
  }

  /**
   * Highlight query terms in text
   */
  private highlightTerms(text: string, terms: string[]): string {
    let result = text;
    for (const term of terms) {
      const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
      result = result.replace(regex, '<mark>$1</mark>');
    }
    return result;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get the number of indexed documents
   */
  get documentCount(): number {
    return this.documents.size;
  }

  /**
   * Check if a document is indexed
   */
  hasDocument(documentId: string): boolean {
    return this.documents.has(documentId);
  }
}
