/**
 * Search Index Manager
 * 
 * Singleton manager for the browser search engine that provides
 * automatic index synchronization with article repository operations.
 * 
 * @module search/searchIndexManager
 */

import { BrowserSearchEngine } from './browserSearchEngine';
import type { SearchDocument, SearchResult, SearchOptions, Article } from '../repositories/types';

/**
 * Singleton search engine instance
 */
let searchEngineInstance: BrowserSearchEngine | null = null;

/**
 * Get the singleton search engine instance
 */
export function getSearchEngine(): BrowserSearchEngine {
  if (!searchEngineInstance) {
    searchEngineInstance = new BrowserSearchEngine();
  }
  return searchEngineInstance;
}

/**
 * Reset the search engine instance (for testing)
 */
export function resetSearchEngine(): void {
  searchEngineInstance = null;
}

/**
 * Convert an Article to a SearchDocument
 */
export function articleToSearchDocument(article: Article): SearchDocument {
  return {
    id: article.id,
    title: article.title,
    content: article.content || '',
    code: article.code || undefined,
    tags: article.tags?.map(t => t.name) || []
  };
}

/**
 * Index an article in the search engine
 */
export async function indexArticle(article: Article): Promise<void> {
  const searchEngine = getSearchEngine();
  const document = articleToSearchDocument(article);
  await searchEngine.index(document);
}

/**
 * Remove an article from the search index
 */
export async function removeArticleFromIndex(articleId: string): Promise<void> {
  const searchEngine = getSearchEngine();
  await searchEngine.remove(articleId);
}

/**
 * Search articles using the search engine
 */
export async function searchArticles(
  query: string, 
  options?: SearchOptions
): Promise<SearchResult[]> {
  const searchEngine = getSearchEngine();
  return searchEngine.search(query, options);
}

/**
 * Reindex all articles
 */
export async function reindexAllArticles(articles: Article[]): Promise<void> {
  const searchEngine = getSearchEngine();
  const documents = articles.map(articleToSearchDocument);
  await searchEngine.reindex(documents);
}
