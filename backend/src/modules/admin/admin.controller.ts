import { Controller, Get, Post, Query, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from './guards/admin.guard';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), AdminGuard)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: '全站统计', description: '获取全站统计数据' })
  async getSiteStats() {
    return this.adminService.getSiteStats();
  }

  @Get('users/statistics')
  @ApiOperation({
    summary: '用户统计列表',
    description: '使用视图 v_user_statistics 获取所有用户统计',
  })
  async getUserStatistics() {
    return this.adminService.getUserStatistics();
  }

  @Get('users/:id/stats')
  @ApiOperation({
    summary: '指定用户统计',
    description: '使用存储过程 sp_get_user_stats 获取指定用户统计',
  })
  @ApiParam({ name: 'id', description: '用户ID' })
  async getUserStatsById(@Param('id') userId: string) {
    return this.adminService.getUserStatsById(userId);
  }

  @Get('users/:id/articles')
  @ApiOperation({
    summary: '用户文章列表',
    description: '使用存储过程 sp_get_user_articles 获取用户文章',
  })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  @ApiQuery({ name: 'type', required: false, description: '文章类型' })
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

  @Get('tags/popular')
  @ApiOperation({
    summary: '热门标签',
    description: '使用视图 v_popular_tags 获取热门标签',
  })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量限制' })
  async getPopularTags(@Query('limit') limit?: string) {
    return this.adminService.getPopularTags(limit ? parseInt(limit) : 20);
  }

  @Get('articles/details')
  @ApiOperation({
    summary: '文章详情列表',
    description: '使用视图 v_article_details 获取文章详情',
  })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量限制' })
  async getArticleDetails(@Query('limit') limit?: string) {
    return this.adminService.getArticleDetails(limit ? parseInt(limit) : 50);
  }

  @Get('logs')
  @ApiOperation({
    summary: '操作日志',
    description: '获取触发器自动记录的操作日志',
  })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  async getOperationLogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.getOperationLogs(
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
    );
  }

  @Post('cleanup/shares')
  @ApiOperation({
    summary: '清理过期分享',
    description: '使用存储过程 sp_cleanup_expired_shares 清理过期分享',
  })
  async cleanupExpiredShares() {
    return this.adminService.cleanupExpiredShares();
  }
}
