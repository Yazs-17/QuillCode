/**
 * ============================================
 * 搜索服务 - Search Service
 * ============================================
 * 
 * 📌 作用：封装 Elasticsearch 搜索功能
 * 📌 框架：NestJS + @elastic/elasticsearch
 * 
 * 🔧 自定义指南：
 * - 修改 ArticleDocument 接口适配你的数据结构
 * - 修改索引映射 (mappings) 适配你的字段
 * - 添加更多搜索方法（按标签搜索、按日期范围等）
 */

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

/**
 * 文档类型定义
 * 
 * 🔧 根据你的业务修改这个接口
 */
export interface ArticleDocument {
	id: string;
	title: string;
	content: string;
	tags: string[];
	userId: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 搜索结果类型
 */
export interface SearchResult {
	id: string;
	title: string;
	content: string;
	tags: string[];
	/** 高亮片段 */
	highlights: {
		title?: string[];
		content?: string[];
	};
	/** 相关性得分 */
	score: number;
}

@Injectable()
export class SearchService implements OnModuleInit {
	private readonly logger = new Logger(SearchService.name);
	private client: Client;
	private indexName: string;
	private isConnected = false;

	constructor(private configService: ConfigService) {
		this.indexName = this.configService.get<string>('ELASTICSEARCH_INDEX') || 'articles';
	}

	/**
	 * 模块初始化时连接 Elasticsearch
	 */
	async onModuleInit() {
		const node = this.configService.get<string>('ELASTICSEARCH_NODE') || 'http://localhost:9200';
		this.client = new Client({ node });

		await this.checkConnection();
		if (this.isConnected) {
			await this.createIndexIfNotExists();
		}
	}

	/**
	 * 检查 ES 连接状态
	 */
	private async checkConnection(): Promise<void> {
		try {
			await this.client.ping();
			this.isConnected = true;
			this.logger.log('✅ Elasticsearch 连接成功');
		} catch {
			this.isConnected = false;
			this.logger.warn('⚠️ Elasticsearch 不可用，搜索功能已禁用');
		}
	}

	/**
	 * 创建索引（如果不存在）
	 * 
	 * 🔧 根据你的字段修改 mappings
	 */
	private async createIndexIfNotExists(): Promise<void> {
		try {
			const exists = await this.client.indices.exists({ index: this.indexName });

			if (!exists) {
				await this.client.indices.create({
					index: this.indexName,
					settings: {
						analysis: {
							analyzer: {
								// 自定义分析器
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
							tags: { type: 'keyword' },
							userId: { type: 'keyword' },
							createdAt: { type: 'date' },
							updatedAt: { type: 'date' },
						},
					},
				});
				this.logger.log(`✅ 索引 "${this.indexName}" 创建成功`);
			}
		} catch (error) {
			this.logger.error('创建索引失败', error);
		}
	}

	/**
	 * ========================================
	 * 索引文档
	 * ========================================
	 * 
	 * 将文档添加到 Elasticsearch 索引
	 * 
	 * @param document - 要索引的文档
	 * 
	 * @example
	 * await searchService.indexDocument({
	 *   id: '123',
	 *   title: '文章标题',
	 *   content: '文章内容...',
	 *   tags: ['JavaScript', 'NestJS'],
	 *   userId: 'user-1',
	 *   createdAt: new Date(),
	 *   updatedAt: new Date(),
	 * });
	 */
	async indexDocument(document: ArticleDocument): Promise<void> {
		if (!this.isConnected) {
			this.logger.warn('ES 未连接，跳过索引');
			return;
		}

		try {
			await this.client.index({
				index: this.indexName,
				id: document.id,
				document,
				refresh: true,  // 立即刷新，使文档可搜索
			});
			this.logger.log(`文档已索引: ${document.id}`);
		} catch (error) {
			this.logger.error(`索引文档失败: ${document.id}`, error);
		}
	}

	/**
	 * ========================================
	 * 删除文档
	 * ========================================
	 */
	async removeDocument(documentId: string): Promise<void> {
		if (!this.isConnected) return;

		try {
			await this.client.delete({
				index: this.indexName,
				id: documentId,
				refresh: true,
			});
		} catch (error) {
			this.logger.error(`删除文档失败: ${documentId}`, error);
		}
	}

	/**
	 * ========================================
	 * 搜索文档
	 * ========================================
	 * 
	 * @param query - 搜索关键词
	 * @param userId - 可选，限制搜索范围到特定用户
	 * @returns 搜索结果列表
	 * 
	 * @example
	 * const results = await searchService.search('JavaScript');
	 * // 或限制到特定用户
	 * const results = await searchService.search('JavaScript', 'user-1');
	 */
	async search(query: string, userId?: string): Promise<SearchResult[]> {
		if (!this.isConnected) {
			this.logger.warn('ES 未连接，返回空结果');
			return [];
		}

		try {
			// 构建查询条件
			const must: object[] = [
				{
					multi_match: {
						query,
						fields: ['title^3', 'content^2', 'tags^2'],  // 标题权重最高
						type: 'best_fields',
						fuzziness: 'AUTO',  // 模糊匹配
					},
				},
			];

			// 如果指定了用户，添加过滤条件
			if (userId) {
				must.push({ term: { userId } });
			}

			const response = await this.client.search<ArticleDocument>({
				index: this.indexName,
				query: { bool: { must } },
				highlight: {
					fields: {
						title: { number_of_fragments: 1 },
						content: { number_of_fragments: 2, fragment_size: 150 },
					},
					pre_tags: ['<mark>'],   // 高亮标签
					post_tags: ['</mark>'],
				},
				size: 20,  // 最多返回 20 条
			});

			// 转换结果格式
			return response.hits.hits.map((hit) => ({
				id: hit._source?.id || '',
				title: hit._source?.title || '',
				content: hit._source?.content || '',
				tags: hit._source?.tags || [],
				highlights: {
					title: hit.highlight?.title,
					content: hit.highlight?.content,
				},
				score: hit._score || 0,
			}));
		} catch (error) {
			this.logger.error('搜索失败', error);
			return [];
		}
	}

	/**
	 * 检查 ES 是否可用
	 */
	isAvailable(): boolean {
		return this.isConnected;
	}
}
