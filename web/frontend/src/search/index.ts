/**
 * Search Module
 * 
 * Exports all search engine implementations and utilities.
 */

export { BrowserSearchEngine } from './browserSearchEngine';
export { ApiSearchEngine } from './apiSearchEngine';
export {
  getSearchEngine,
  resetSearchEngine,
  articleToSearchDocument,
  indexArticle,
  removeArticleFromIndex,
  searchArticles,
  reindexAllArticles
} from './searchIndexManager';
