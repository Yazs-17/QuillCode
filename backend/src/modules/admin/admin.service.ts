import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  User,
  Article,
  Tag,
  Share,
  Comment,
  ArticleType,
} from '../../entities';
import {
  SiteStatsDto,
  UserStatsDto,
  PopularTagDto,
  OperationLogDto,
  ArticleDetailDto,
} from './dto/stats.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    @InjectRepository(Share)
    private shareRepository: Repository<Share>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    private dataSource: DataSource,
  ) {}

  // 获取全站统计数据
  async getSiteStats(): Promise<SiteStatsDto> {
    const [
      totalUsers,
      totalArticles,
      totalTags,
      totalShares,
      totalComments,
      algorithmCount,
      snippetCount,
      htmlCount,
      recentUsers,
      recentArticles,
    ] = await Promise.all([
      this.userRepository.count(),
      this.articleRepository.count(),
      this.tagRepository.count(),
      this.shareRepository.count(),
      this.commentRepository.count(),
      this.articleRepository.count({ where: { type: ArticleType.ALGORITHM } }),
      this.articleRepository.count({ where: { type: ArticleType.SNIPPET } }),
      this.articleRepository.count({ where: { type: ArticleType.HTML } }),
      this.userRepository
        .createQueryBuilder('user')
        .where('user.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)')
        .getCount(),
      this.articleRepository
        .createQueryBuilder('article')
        .where('article.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)')
        .getCount(),
    ]);

    return {
      totalUsers,
      totalArticles,
      totalTags,
      totalShares,
      totalComments,
      articlesByType: {
        algorithm: algorithmCount,
        snippet: snippetCount,
        html: htmlCount,
      },
      recentUsers,
      recentArticles,
    };
  }

  // 使用视图获取用户统计列表
  async getUserStatistics(): Promise<UserStatsDto[]> {
    const results = await this.dataSource.query(
      'SELECT * FROM v_user_statistics ORDER BY article_count DESC',
    );

    return results.map((row: any) => ({
      userId: row.user_id,
      username: row.username,
      email: row.email,
      articleCount: Number(row.article_count),
      algorithmCount: Number(row.algorithm_count),
      snippetCount: Number(row.snippet_count),
      htmlCount: Number(row.html_count),
      totalShares: Number(row.total_shares),
      registeredAt: row.registered_at,
    }));
  }

  // 使用视图获取热门标签
  async getPopularTags(limit: number = 20): Promise<PopularTagDto[]> {
    const results = await this.dataSource.query(
      'SELECT * FROM v_popular_tags LIMIT ?',
      [limit],
    );

    return results.map((row: any) => ({
      tagId: row.tag_id,
      tagName: row.tag_name,
      usageCount: Number(row.usage_count),
    }));
  }

  // 【视图】使用 v_article_details 获取文章详情列表
  async getArticleDetails(limit: number = 50): Promise<ArticleDetailDto[]> {
    const results = await this.dataSource.query(
      'SELECT * FROM v_article_details ORDER BY created_at DESC LIMIT ?',
      [limit],
    );

    return results.map((row: any) => ({
      articleId: row.article_id,
      title: row.title,
      type: row.type,
      language: row.language,
      authorName: row.author_name,
      authorEmail: row.author_email,
      shareCount: Number(row.share_count),
      tagNames: row.tag_names,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  // 获取操作日志
  async getOperationLogs(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ logs: OperationLogDto[]; total: number }> {
    const offset = (page - 1) * pageSize;

    const [logs, countResult] = await Promise.all([
      this.dataSource.query(
        'SELECT * FROM operation_logs ORDER BY operated_at DESC LIMIT ? OFFSET ?',
        [pageSize, offset],
      ),
      this.dataSource.query('SELECT COUNT(*) as total FROM operation_logs'),
    ]);

    return {
      logs: logs.map((row: any) => ({
        id: row.id,
        tableName: row.table_name,
        operationType: row.operation_type,
        recordId: row.record_id,
        oldData: row.old_data,
        newData: row.new_data,
        operatedAt: row.operated_at,
      })),
      total: Number(countResult[0].total),
    };
  }

  // 【存储过程】清理过期分享
  async cleanupExpiredShares(): Promise<{ deletedCount: number }> {
    const result = await this.dataSource.query(
      'CALL sp_cleanup_expired_shares()',
    );
    return { deletedCount: result[0]?.[0]?.deleted_shares || 0 };
  }

  // 【存储过程】获取指定用户统计
  async getUserStatsById(userId: string): Promise<any> {
    const result = await this.dataSource.query('CALL sp_get_user_stats(?)', [
      userId,
    ]);
    return result[0]?.[0] || null;
  }

  // 【存储过程】使用 sp_get_user_articles 获取用户文章列表
  async getUserArticles(
    userId: string,
    page: number = 1,
    pageSize: number = 10,
    type?: string,
  ): Promise<any[]> {
    const result = await this.dataSource.query(
      'CALL sp_get_user_articles(?, ?, ?, ?)',
      [userId, page, pageSize, type || ''],
    );
    return result[0] || [];
  }

  // 【存储过程】使用 sp_create_article_with_tags 创建文章（演示用）
  async createArticleWithTags(
    articleId: string,
    userId: string,
    title: string,
    content: string,
    code: string,
    type: string,
    language: string,
    tagIds: string[],
  ): Promise<any> {
    const tagIdsStr = tagIds.join(',');
    const result = await this.dataSource.query(
      'CALL sp_create_article_with_tags(?, ?, ?, ?, ?, ?, ?, ?)',
      [articleId, userId, title, content, code, type, language, tagIdsStr],
    );
    return result[0]?.[0] || null;
  }
}
