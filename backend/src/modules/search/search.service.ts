import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../../entities';

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
	private isConnected = true; // SQLite is local, considered always connected

	constructor(
		private configService: ConfigService,
		@InjectRepository(Article)
		private articleRepository: Repository<Article>,
	) {}

	async onModuleInit() {
		await this.createIndexIfNotExists();
	}

	private async createIndexIfNotExists(): Promise<void> {
		try {
			await this.articleRepository.query(`
				CREATE VIRTUAL TABLE IF NOT EXISTS article_fts USING fts5(
					id UNINDEXED,
					title,
					content,
					code,
					tags,
					type UNINDEXED,
					language UNINDEXED,
					userId UNINDEXED,
					tokenize='unicode61'
				)
			`);
			this.logger.log('SQLite FTS5 virtual table "article_fts" ensured');
		} catch (error) {
			this.logger.error('Failed to create SQLite FTS5 table', error);
			this.isConnected = false;
		}
	}

	async indexArticle(article: Article): Promise<void> {
		if (!this.isConnected) return;

		try {
			const tags = article.articleTags?.map(at => at.tag?.name).filter(Boolean).join(' ') || '';

			const queryRunner = this.articleRepository.manager.connection.createQueryRunner();
			await queryRunner.connect();
			await queryRunner.startTransaction();
			try {
				await queryRunner.query(`DELETE FROM article_fts WHERE id = ?`, [article.id]);
				await queryRunner.query(
					`INSERT INTO article_fts (id, title, content, code, tags, type, language, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
					[article.id, article.title, article.content || '', article.code || '', tags, article.type, article.language, article.userId]
				);
				await queryRunner.commitTransaction();
				this.logger.log(`Article indexed successfully in FTS5: ${article.id}`);
			} catch (err) {
				await queryRunner.rollbackTransaction();
				throw err;
			} finally {
				await queryRunner.release();
			}
		} catch (error) {
			this.logger.error(`Failed to index article: ${article.id}`, error);
		}
	}

	async removeArticle(articleId: string): Promise<void> {
		if (!this.isConnected) return;

		try {
			await this.articleRepository.query(`DELETE FROM article_fts WHERE id = ?`, [articleId]);
			this.logger.debug(`Article removed from FTS5 index: ${articleId}`);
		} catch (error) {
			this.logger.error(`Failed to remove article from FTS5 index: ${articleId}`, error);
		}
	}

	async search(query: string, userId?: string): Promise<SearchResult[]> {
		if (!this.isConnected || !query.trim()) {
			return [];
		}

		try {
			this.logger.log(`Searching for: "${query}" by user: ${userId}`);

			// Format query for SQLite FTS5: wrap in quotes to perform phrase search,
			// or replace spaces with AND for term search.
			// Simple approach: remove special FTS chars and replace spaces with asterisks
			const safeQuery = query.replace(/['"]/g, '').trim().split(/\s+/).map(t => `"${t}"*`).join(' AND ');

			const sqlParams: any[] = [safeQuery];
			let userCondition = '';
			if (userId) {
				userCondition = 'AND userId = ?';
				sqlParams.push(userId);
			}

			const results = await this.articleRepository.query(`
				SELECT 
					id, 
					title, 
					content, 
					type, 
					language, 
					tags,
					highlight(article_fts, 1, '<mark>', '</mark>') as highlight_title,
					snippet(article_fts, 2, '<mark>', '</mark>', '...', 15) as highlight_content,
					snippet(article_fts, 3, '<mark>', '</mark>', '...', 15) as highlight_code,
					rank as score
				FROM article_fts
				WHERE article_fts MATCH ? ${userCondition}
				ORDER BY rank
				LIMIT 20
			`, sqlParams);

			this.logger.log(`Search found ${results.length} results`);

			return results.map((row: any) => ({
				id: row.id,
				title: row.title,
				content: row.content,
				type: row.type,
				language: row.language,
				tags: row.tags ? row.tags.split(' ').filter(Boolean) : [],
				highlights: {
					title: row.highlight_title ? [row.highlight_title] : undefined,
					content: row.highlight_content ? [row.highlight_content] : undefined,
					code: row.highlight_code ? [row.highlight_code] : undefined,
				},
				score: -row.score, // SQLite rank is usually negative (more negative = better)
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
		this.logger.log(`Starting FTS5 reindex for user: ${userId}`);

		if (!this.isConnected) return 0;

		try {
			this.logger.log(`Querying articles for user: ${userId}`);
			const articles = await this.articleRepository.find({
				where: { userId },
				relations: ['articleTags', 'articleTags.tag'],
			});

			this.logger.log(`Found ${articles.length} articles for user ${userId}`);

			for (const article of articles) {
				await this.indexArticle(article);
			}

			this.logger.log(`Reindex completed: ${articles.length} articles indexed`);
			return articles.length;
		} catch (error) {
			this.logger.error('FTS5 Reindex failed', error);
			return 0;
		}
	}
}