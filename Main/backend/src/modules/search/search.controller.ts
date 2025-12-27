import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common';
import { SearchService, SearchResult } from './search.service';
import { RecommendService, RecommendedArticle } from './recommend.service';

@Controller('search')
export class SearchController {
	constructor(
		private readonly searchService: SearchService,
		private readonly recommendService: RecommendService,
	) { }

	@Get()
	@UseGuards(JwtAuthGuard)
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
	async status(): Promise<{ available: boolean }> {
		return { available: this.searchService.isAvailable() };
	}

	@Get('reindex')
	@UseGuards(JwtAuthGuard)
	async reindex(@Request() req): Promise<{ message: string; count: number }> {
		const count = await this.searchService.reindexUserArticles(req.user.id);
		return { message: 'Reindex completed', count };
	}

	@Get('recommend')
	@UseGuards(JwtAuthGuard)
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
