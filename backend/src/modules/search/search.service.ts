import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Article } from '../../entities';

export interface ArticleDocument {
  id: string;
  title: string;
  content: string;
  code: string;
  type: string;
  language: string;
  tags: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  type: string;
  language: string;
  tags: string[];
  highlights: {
    title?: string[];
    content?: string[];
    code?: string[];
  };
  score: number;
}

type SearchBackend = 'elasticsearch' | 'sqlite-fts' | 'none';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private esClient: any; // ElasticSearch client (dynamically loaded)
  private indexName: string;
  private isConnected = false;
  private searchBackend: SearchBackend = 'none';

  constructor(
    private configService: ConfigService,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    this.indexName =
      this.configService.get<string>('elasticsearch.index') || 'articles';
  }

  async onModuleInit() {
    const dbType = this.configService.get<string>('database.type');

    if (dbType === 'sqlite') {
      // Use SQLite FTS5 for search
      this.searchBackend = 'sqlite-fts';
      this.isConnected = true;
      this.logger.log('Using SQLite FTS5 for full-text search');
    } else {
      // Try to connect to ElasticSearch for MySQL mode
      await this.initElasticSearch();
    }
  }

  private async initElasticSearch(): Promise<void> {
    try {
      const { Client } = await import('@elastic/elasticsearch');
      const node = this.configService.get<string>('elasticsearch.node');
      this.esClient = new Client({ node });

      await this.checkElasticSearchConnection();
      if (this.isConnected) {
        await this.createIndexIfNotExists();
      }
    } catch (error) {
      this.logger.warn('ElasticSearch not available, search features disabled');
      this.searchBackend = 'none';
    }
  }

  private async checkElasticSearchConnection(): Promise<void> {
    try {
      await this.esClient.ping();
      this.isConnected = true;
      this.searchBackend = 'elasticsearch';
      this.logger.log('Elasticsearch connected successfully');
    } catch {
      this.isConnected = false;
      this.searchBackend = 'none';
      this.logger.warn('Elasticsearch not available, search features disabled');
    }
  }

  private async createIndexIfNotExists(): Promise<void> {
    if (this.searchBackend !== 'elasticsearch') return;

    try {
      const exists = await this.esClient.indices.exists({
        index: this.indexName,
      });

      if (!exists) {
        await this.esClient.indices.create({
          index: this.indexName,
          settings: {
            analysis: {
              analyzer: {
                article_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'stop'],
                },
              },
            },
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              title: {
                type: 'text',
                analyzer: 'article_analyzer',
                fields: { keyword: { type: 'keyword' } },
              },
              content: { type: 'text', analyzer: 'article_analyzer' },
              code: { type: 'text', analyzer: 'article_analyzer' },
              type: { type: 'keyword' },
              language: { type: 'keyword' },
              tags: { type: 'keyword' },
              userId: { type: 'keyword' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' },
            },
          },
        });
        this.logger.log(`Index "${this.indexName}" created`);
      }
    } catch (error) {
      this.logger.error('Failed to create index', error);
    }
  }

  async indexArticle(article: Article): Promise<void> {
    // SQLite FTS5 is automatically updated via triggers
    if (this.searchBackend === 'sqlite-fts') {
      this.logger.debug(
        `Article ${article.id} indexed via SQLite FTS5 triggers`,
      );
      return;
    }

    if (this.searchBackend !== 'elasticsearch' || !this.isConnected) {
      this.logger.warn('Search backend not connected, skipping index');
      return;
    }

    try {
      const tags =
        article.articleTags?.map((at) => at.tag?.name).filter(Boolean) || [];

      const document: ArticleDocument = {
        id: article.id,
        title: article.title,
        content: article.content || '',
        code: article.code || '',
        type: article.type,
        language: article.language,
        tags: tags,
        userId: article.userId,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
      };

      this.logger.log(`Indexing article: ${article.id} - ${article.title}`);

      await this.esClient.index({
        index: this.indexName,
        id: article.id,
        document,
        refresh: true,
      });

      this.logger.log(`Article indexed successfully: ${article.id}`);
    } catch (error) {
      this.logger.error(`Failed to index article: ${article.id}`, error);
    }
  }

  async removeArticle(articleId: string): Promise<void> {
    // SQLite FTS5 is automatically updated via triggers
    if (this.searchBackend === 'sqlite-fts') {
      this.logger.debug(
        `Article ${articleId} removed from SQLite FTS5 via triggers`,
      );
      return;
    }

    if (this.searchBackend !== 'elasticsearch' || !this.isConnected) return;

    try {
      await this.esClient.delete({
        index: this.indexName,
        id: articleId,
        refresh: true,
      });
      this.logger.debug(`Article removed from index: ${articleId}`);
    } catch (error) {
      this.logger.error(
        `Failed to remove article from index: ${articleId}`,
        error,
      );
    }
  }

  async search(query: string, userId?: string): Promise<SearchResult[]> {
    if (this.searchBackend === 'sqlite-fts') {
      return this.searchWithSqliteFts(query, userId);
    }

    if (this.searchBackend === 'elasticsearch') {
      return this.searchWithElasticSearch(query, userId);
    }

    this.logger.warn('No search backend available, returning empty results');
    return [];
  }

  private async searchWithSqliteFts(
    query: string,
    userId?: string,
  ): Promise<SearchResult[]> {
    try {
      this.logger.log(
        `SQLite FTS5 searching for: "${query}" by user: ${userId}`,
      );

      // Escape special FTS5 characters and prepare query
      const ftsQuery = this.prepareFtsQuery(query);

      // Build the SQL query with FTS5
      let sql = `
				SELECT 
					a.id,
					a.title,
					a.content,
					a.code,
					a.type,
					a.language,
					a.user_id as userId,
					highlight(articles_fts, 0, '<mark>', '</mark>') as title_highlight,
					highlight(articles_fts, 1, '<mark>', '</mark>') as content_highlight,
					highlight(articles_fts, 2, '<mark>', '</mark>') as code_highlight,
					bm25(articles_fts, 3.0, 2.0, 1.0) as score
				FROM articles_fts
				INNER JOIN articles a ON articles_fts.rowid = a.rowid
				WHERE articles_fts MATCH ?
			`;

      const params: any[] = [ftsQuery];

      if (userId) {
        sql += ` AND a.user_id = ?`;
        params.push(userId);
      }

      sql += ` ORDER BY score LIMIT 20`;

      const results = await this.dataSource.query(sql, params);

      this.logger.log(`SQLite FTS5 found ${results.length} results`);

      // Get tags for each result
      const searchResults: SearchResult[] = await Promise.all(
        results.map(async (row: any) => {
          const tags = await this.getArticleTags(row.id);
          return {
            id: row.id,
            title: row.title,
            content: row.content || '',
            type: row.type,
            language: row.language,
            tags,
            highlights: {
              title: row.title_highlight ? [row.title_highlight] : undefined,
              content: row.content_highlight
                ? [row.content_highlight]
                : undefined,
              code: row.code_highlight ? [row.code_highlight] : undefined,
            },
            score: Math.abs(row.score || 0), // BM25 returns negative scores
          };
        }),
      );

      return searchResults;
    } catch (error) {
      this.logger.error('SQLite FTS5 search failed', error);
      return [];
    }
  }

  private prepareFtsQuery(query: string): string {
    // Escape special FTS5 characters
    const escaped = query
      .replace(/['"]/g, '') // Remove quotes
      .replace(/[*^$(){}[\]\\]/g, ' ') // Replace special chars with space
      .trim();

    // Split into words and add prefix matching
    const words = escaped.split(/\s+/).filter((w) => w.length > 0);

    if (words.length === 0) {
      return '*'; // Match all if empty query
    }

    // Use OR for multiple words with prefix matching
    return words.map((w) => `${w}*`).join(' OR ');
  }

  private async getArticleTags(articleId: string): Promise<string[]> {
    try {
      const result = await this.dataSource.query(
        `
				SELECT t.name 
				FROM tags t
				INNER JOIN article_tags at ON t.id = at.tag_id
				WHERE at.article_id = ?
			`,
        [articleId],
      );
      return result.map((r: any) => r.name);
    } catch {
      return [];
    }
  }

  private async searchWithElasticSearch(
    query: string,
    userId?: string,
  ): Promise<SearchResult[]> {
    if (!this.isConnected) {
      this.logger.warn('Elasticsearch not connected, returning empty results');
      return [];
    }

    try {
      this.logger.log(`Searching for: "${query}" by user: ${userId}`);

      const must: object[] = [
        {
          multi_match: {
            query,
            fields: ['title^3', 'content^2', 'code', 'tags^2'],
            type: 'best_fields',
            fuzziness: 'AUTO',
          },
        },
      ];

      if (userId) {
        must.push({ term: { userId } });
      }

      const response = await this.esClient.search({
        index: this.indexName,
        query: {
          bool: { must },
        },
        highlight: {
          fields: {
            title: { number_of_fragments: 1 },
            content: { number_of_fragments: 2, fragment_size: 150 },
            code: { number_of_fragments: 1, fragment_size: 200 },
          },
          pre_tags: ['<mark>'],
          post_tags: ['</mark>'],
        },
        size: 20,
      });

      this.logger.log(`Search found ${response.hits.hits.length} results`);

      return response.hits.hits.map((hit: any) => ({
        id: hit._source?.id || '',
        title: hit._source?.title || '',
        content: hit._source?.content || '',
        type: hit._source?.type || '',
        language: hit._source?.language || '',
        tags: hit._source?.tags || [],
        highlights: {
          title: hit.highlight?.title,
          content: hit.highlight?.content,
          code: hit.highlight?.code,
        },
        score: hit._score || 0,
      }));
    } catch (error) {
      this.logger.error('Search failed', error);
      return [];
    }
  }

  isAvailable(): boolean {
    return this.isConnected;
  }

  getBackend(): SearchBackend {
    return this.searchBackend;
  }

  async reindexUserArticles(userId: string): Promise<number> {
    this.logger.log(`Starting reindex for user: ${userId}`);

    // SQLite FTS5 doesn't need manual reindexing (triggers handle it)
    if (this.searchBackend === 'sqlite-fts') {
      this.logger.log('SQLite FTS5 uses automatic triggers, no reindex needed');
      // Return count of user's articles
      const count = await this.articleRepository.count({ where: { userId } });
      return count;
    }

    if (this.searchBackend !== 'elasticsearch' || !this.isConnected) {
      this.logger.warn('Search backend not connected, cannot reindex');
      return 0;
    }

    try {
      this.logger.log(`Querying articles for user: ${userId}`);
      const articles = await this.articleRepository.find({
        where: { userId },
        relations: ['articleTags', 'articleTags.tag'],
      });

      this.logger.log(`Found ${articles.length} articles for user ${userId}`);

      for (const article of articles) {
        this.logger.log(`Indexing article: ${article.id} - ${article.title}`);
        await this.indexArticle(article);
      }

      this.logger.log(`Reindex completed: ${articles.length} articles indexed`);
      return articles.length;
    } catch (error) {
      this.logger.error('Reindex failed', error);
      return 0;
    }
  }

  /**
   * Rebuild SQLite FTS5 index (useful after bulk imports)
   */
  async rebuildFtsIndex(): Promise<void> {
    if (this.searchBackend !== 'sqlite-fts') {
      this.logger.warn('Not using SQLite FTS5, skipping rebuild');
      return;
    }

    try {
      this.logger.log('Rebuilding SQLite FTS5 index...');

      // Delete all FTS entries
      await this.dataSource.query(
        `INSERT INTO articles_fts(articles_fts) VALUES('delete-all')`,
      );

      // Rebuild from articles table
      await this.dataSource.query(`
				INSERT INTO articles_fts(rowid, title, content, code)
				SELECT rowid, title, content, code FROM articles
			`);

      this.logger.log('SQLite FTS5 index rebuilt successfully');
    } catch (error) {
      this.logger.error('Failed to rebuild FTS5 index', error);
    }
  }
}
