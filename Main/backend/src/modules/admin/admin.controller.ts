import {
	Controller,
	Get,
	Post,
	Query,
	Param,
	UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from './guards/admin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminController {
	constructor(private readonly adminService: AdminService) { }

	// 获取全站统计
	@Get('stats')
	async getSiteStats() {
		return this.adminService.getSiteStats();
	}

	// 【视图】获取所有用户统计（使用 v_user_statistics）
	@Get('users/statistics')
	async getUserStatistics() {
		return this.adminService.getUserStatistics();
	}

	// 【存储过程】获取指定用户统计（使用 sp_get_user_stats）
	@Get('users/:id/stats')
	async getUserStatsById(@Param('id') userId: string) {
		return this.adminService.getUserStatsById(userId);
	}

	// 【存储过程】获取用户文章列表（使用 sp_get_user_articles）
	@Get('users/:id/articles')
	async getUserArticles(
		@Param('id') userId: string,
		@Query('page') page?: string,
		@Query('pageSize') pageSize?: string,
		@Query('type') type?: string,
	) {
		return this.adminService.getUserArticles(
			userId,
			page ? parseInt(page) : 1,
			pageSize ? parseInt(pageSize) : 10,
			type,
		);
	}

	// 【视图】获取热门标签（使用 v_popular_tags）
	@Get('tags/popular')
	async getPopularTags(@Query('limit') limit?: string) {
		return this.adminService.getPopularTags(limit ? parseInt(limit) : 20);
	}

	// 【视图】获取文章详情列表（使用 v_article_details）
	@Get('articles/details')
	async getArticleDetails(@Query('limit') limit?: string) {
		return this.adminService.getArticleDetails(limit ? parseInt(limit) : 50);
	}

	// 获取操作日志（触发器自动记录）
	@Get('logs')
	async getOperationLogs(
		@Query('page') page?: string,
		@Query('pageSize') pageSize?: string,
	) {
		return this.adminService.getOperationLogs(
			page ? parseInt(page) : 1,
			pageSize ? parseInt(pageSize) : 20,
		);
	}

	// 【存储过程】清理过期分享（使用 sp_cleanup_expired_shares）
	@Post('cleanup/shares')
	async cleanupExpiredShares() {
		return this.adminService.cleanupExpiredShares();
	}
}
