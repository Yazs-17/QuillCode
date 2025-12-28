import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '@elastic/elasticsearch';
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

@Injectable()
export class SearchService implements OnModuleInit {
	private readonly logger = new Logger(SearchService.name);
	private client: Client;
	private indexName: string;
	private isConnected = false;

	constructor(
		private configService: ConfigService,
		@InjectRepository(Article)
		private articleRepository: Repository<Article>,
	) {
		this.indexName = this.configService.get<string>('elasticsearch.index') || 'articles';
	}

	async onModuleInit() {
		const node = this.configService.get<string>('elasticsearch.node');

		this.client = new Client({ node });

		await this.checkConnection();
		if (this.isConnected) {
			await this.createIndexIfNotExists();
		}
	}


	private async checkConnection(): Promise<void> {
		try {
			await this.client.ping();
			this.isConnected = true;
			this.logger.log('Elasticsearch connected successfully');
		} catch {
			this.isConnected = false;
			this.logger.warn('Elasticsearch not available, search features disabled');
		}
	}

	private async createIndexIfNotExists(): Promise<void> {
		try {
			const exists = await this.client.indices.exists({ index: this.indexName });

			if (!exists) {
				await this.client.indices.create({
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
								fields: { keyword: { type: 'keyword' } }
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
		if (!this.isConnected) {
			this.logger.warn('Elasticsearch not connected, skipping index');
			return;
		}

		try {
			const tags = article.articleTags?.map(at => at.tag?.name).filter(Boolean) || [];

			const document: ArticleDocument = {
				id: article.id,
				title: article.title,
				content: article.content || '',
				code: article.code || '',
				type: article.type,
				language: article.language,
				tags: tags as string[],
				userId: article.userId,
				createdAt: article.createdAt,
				updatedAt: article.updatedAt,
			};

			this.logger.log(`Indexing article: ${article.id} - ${article.title}`);

			await this.client.index({
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
		if (!this.isConnected) return;

		try {
			await this.client.delete({
				index: this.indexName,
				id: articleId,
				refresh: true,
			});
			this.logger.debug(`Article removed from index: ${articleId}`);
		} catch (error) {
			this.logger.error(`Failed to remove article from index: ${articleId}`, error);
		}
	}


	async search(query: string, userId?: string): Promise<SearchResult[]> {
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

			const response = await this.client.search<ArticleDocument>({
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

			return response.hits.hits.map((hit) => ({
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

	async reindexUserArticles(userId: string): Promise<number> {
		this.logger.log(`Starting reindex for user: ${userId}`);

		if (!this.isConnected) {
			this.logger.warn('Elasticsearch not connected, cannot reindex');
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
}
