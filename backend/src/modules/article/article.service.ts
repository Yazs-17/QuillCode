import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Article, Tag, ArticleTag, Share } from '../../entities';
import { CreateArticleDto, UpdateArticleDto } from './dto';
import { ErrorCode, ErrorMessages } from '../../common';
import { SearchService } from '../search/search.service';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    @InjectRepository(ArticleTag)
    private articleTagRepository: Repository<ArticleTag>,
    @InjectRepository(Share)
    private shareRepository: Repository<Share>,
    private searchService: SearchService,
  ) {}

  async create(
    userId: string,
    createArticleDto: CreateArticleDto,
  ): Promise<Article> {
    const { tagIds, ...articleData } = createArticleDto;

    // Create article
    const article = this.articleRepository.create({
      ...articleData,
      userId,
    });

    const savedArticle = await this.articleRepository.save(article);

    // Handle tags if provided
    if (tagIds && tagIds.length > 0) {
      await this.updateArticleTags(savedArticle.id, tagIds);
    }

    const fullArticle = await this.findOne(savedArticle.id, userId);

    // Index in Elasticsearch
    await this.searchService.indexArticle(fullArticle);

    return fullArticle;
  }

  async findAll(userId: string): Promise<(Article & { hasShare: boolean })[]> {
    const articles = await this.articleRepository.find({
      where: { userId },
      relations: ['articleTags', 'articleTags.tag'],
      order: { updatedAt: 'DESC' },
    });

    // Check which articles have shares
    const articleIds = articles.map((a) => a.id);
    const shares = await this.shareRepository.find({
      where: { articleId: In(articleIds) },
      select: ['articleId'],
    });
    const sharedArticleIds = new Set(shares.map((s) => s.articleId));

    return articles.map((article) => ({
      ...article,
      hasShare: sharedArticleIds.has(article.id),
    }));
  }

  async findOne(id: string, userId?: string): Promise<Article> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['articleTags', 'articleTags.tag', 'user'],
    });

    if (!article) {
      throw new NotFoundException({
        code: ErrorCode.ARTICLE_NOT_FOUND,
        message: ErrorMessages[ErrorCode.ARTICLE_NOT_FOUND],
      });
    }

    // If userId provided, check ownership
    if (userId && article.userId !== userId) {
      throw new ForbiddenException({
        code: ErrorCode.PERMISSION_DENIED,
        message: ErrorMessages[ErrorCode.PERMISSION_DENIED],
      });
    }

    return article;
  }

  async update(
    id: string,
    userId: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<Article> {
    const article = await this.findOne(id, userId);

    const { tagIds, ...updateData } = updateArticleDto;

    // Update article fields
    Object.assign(article, updateData);
    await this.articleRepository.save(article);

    // Update tags if provided
    if (tagIds !== undefined) {
      await this.updateArticleTags(id, tagIds);
    }

    const updatedArticle = await this.findOne(id, userId);

    // Update in Elasticsearch
    await this.searchService.indexArticle(updatedArticle);

    return updatedArticle;
  }

  async remove(id: string, userId: string): Promise<void> {
    const article = await this.findOne(id, userId);

    // Remove from Elasticsearch
    await this.searchService.removeArticle(id);

    // Remove shares first (they have foreign key to article)
    await this.shareRepository.delete({ articleId: id });

    // Remove article tags
    await this.articleTagRepository.delete({ articleId: id });

    // Remove article
    await this.articleRepository.remove(article);
  }

  private async updateArticleTags(
    articleId: string,
    tagIds: string[],
  ): Promise<void> {
    // Remove existing tags
    await this.articleTagRepository.delete({ articleId });

    if (tagIds.length === 0) return;

    // Verify tags exist
    const tags = await this.tagRepository.find({
      where: { id: In(tagIds) },
    });

    // Create new article-tag relations
    const articleTags = tags.map((tag) =>
      this.articleTagRepository.create({
        articleId,
        tagId: tag.id,
      }),
    );

    await this.articleTagRepository.save(articleTags);
  }
}
