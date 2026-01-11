import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common';
import { SearchService, SearchResult } from './search.service';
import { RecommendService, RecommendedArticle } from './recommend.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
	constructor(
		private readonly searchService: SearchService,
		private readonly recommendService: RecommendService,
	) { }

	@Get()
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: '搜索文章', description: '根据关键词搜索用户的文章' })
	@ApiQuery({ name: 'q', description: '搜索关键词', required: true })
	async search(
		@Query('q') query: string,
		@Request() req,
	): Promise<{ results: SearchResult[]; available: boolean }> {
		console.log('Search request:', { query, userId: req.user?.id, available: this.searchService.isAvailable() });

		if (!query || query.trim().length === 0) {
			return { results: [], available: this.searchService.isAvailable() };
		}

		const results = await this.searchService.search(query.trim(), req.user.id);
		console.log('Search results:', results.length);
		return { results, available: this.searchService.isAvailable() };
	}

	@Get('status')
	@ApiOperation({ summary: '搜索服务状态', description: '检查 Elasticsearch 是否可用' })
	async status(): Promise<{ available: boolean }> {
		return { available: this.searchService.isAvailable() };
	}

	@Get('reindex')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: '重建搜索索引', description: '重新索引当前用户的所有文章到 Elasticsearch' })
	async reindex(@Request() req): Promise<{ message: string; count: number }> {
		const count = await this.searchService.reindexUserArticles(req.user.id);
		return { message: 'Reindex completed', count };
	}

	@Get('recommend')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: '获取推荐文章', description: '根据文章标签获取相关推荐' })
	@ApiQuery({ name: 'articleId', description: '文章ID', required: true })
	async recommend(
		@Query('articleId') articleId: string,
		@Request() req,
	): Promise<{
		recommendations: RecommendedArticle[];
		available: boolean;
		aiEnhanced: boolean;
	}> {
		if (!articleId) {
			return {
				recommendations: [],
				available: this.recommendService.isDevModeEnabled(),
				aiEnhanced: false,
			};
		}

		const recommendations = await this.recommendService.getRecommendations(
			articleId,
			req.user.id,
		);

		return {
			recommendations,
			available: this.recommendService.isDevModeEnabled(),
			aiEnhanced: this.recommendService.isAvailable(),
		};
	}
}
