/**
 * ============================================
 * 搜索控制器 - Search Controller
 * ============================================
 */

import { Controller, Get, Query } from '@nestjs/common';
import { SearchService, SearchResult } from './search.service';

@Controller('search')
export class SearchController {
	constructor(private readonly searchService: SearchService) { }

	/**
	 * GET /search?q=keyword - 搜索
	 * 
	 * 请求示例：
	 * curl "http://localhost:3000/search?q=JavaScript"
	 */
	@Get()
	async search(
		@Query('q') query: string,
		@Query('userId') userId?: string,
	): Promise<{ results: SearchResult[]; available: boolean }> {
		if (!query || query.trim().length === 0) {
			return { results: [], available: this.searchService.isAvailable() };
		}

		const results = await this.searchService.search(query.trim(), userId);
		return { results, available: this.searchService.isAvailable() };
	}

	/**
	 * GET /search/status - 检查 ES 状态
	 */
	@Get('status')
	async status(): Promise<{ available: boolean }> {
		return { available: this.searchService.isAvailable() };
	}
}
