import {
	Injectable,
	NotFoundException,
	ConflictException,
	ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag, ArticleTag, Article } from '../../entities';
import { CreateTagDto } from './dto';
import { ErrorCode, ErrorMessages } from '../../common';

@Injectable()
export class TagService {
	constructor(
		@InjectRepository(Tag)
		private tagRepository: Repository<Tag>,
		@InjectRepository(ArticleTag)
		private articleTagRepository: Repository<ArticleTag>,
		@InjectRepository(Article)
		private articleRepository: Repository<Article>,
	) { }

	async create(createTagDto: CreateTagDto, userId: string): Promise<Tag> {
		// Check if tag already exists for this user (user-scoped uniqueness)
		const existingTag = await this.tagRepository.findOne({
			where: { name: createTagDto.name, userId },
		});

		if (existingTag) {
			throw new ConflictException({
				code: ErrorCode.TAG_EXISTS,
				message: ErrorMessages[ErrorCode.TAG_EXISTS],
			});
		}

		const tag = this.tagRepository.create({
			...createTagDto,
			userId,
		});
		return this.tagRepository.save(tag);
	}

	async findAll(userId: string): Promise<(Tag & { articleCount: number })[]> {
		const tags = await this.tagRepository.find({
			where: { userId },
			order: { name: 'ASC' },
		});

		// Get article counts for each tag (only counting user's articles)
		const tagsWithCount = await Promise.all(
			tags.map(async (tag) => {
				const articleCount = await this.articleTagRepository
					.createQueryBuilder('articleTag')
					.innerJoin('articleTag.article', 'article')
					.where('articleTag.tagId = :tagId', { tagId: tag.id })
					.andWhere('article.userId = :userId', { userId })
					.getCount();
				return { ...tag, articleCount };
			}),
		);

		return tagsWithCount;
	}

	async findOne(id: string, userId: string): Promise<Tag> {
		const tag = await this.tagRepository.findOne({
			where: { id, userId },
		});

		if (!tag) {
			throw new NotFoundException({
				code: ErrorCode.TAG_NOT_FOUND,
				message: ErrorMessages[ErrorCode.TAG_NOT_FOUND],
			});
		}

		return tag;
	}

	async findByName(name: string, userId: string): Promise<Tag | null> {
		return this.tagRepository.findOne({
			where: { name, userId },
		});
	}

	async getArticlesByTag(tagId: string, userId: string): Promise<Article[]> {
		// Verify tag exists and belongs to user
		await this.findOne(tagId, userId);

		// Get articles with this tag that belong to the user
		const articles = await this.articleRepository
			.createQueryBuilder('article')
			.innerJoin('article.articleTags', 'articleTag')
			.leftJoinAndSelect('article.articleTags', 'at')
			.leftJoinAndSelect('at.tag', 'tag')
			.where('articleTag.tagId = :tagId', { tagId })
			.andWhere('article.userId = :userId', { userId })
			.orderBy('article.updatedAt', 'DESC')
			.getMany();

		return articles;
	}

	async remove(id: string, userId: string): Promise<void> {
		// Verify tag exists and belongs to user
		const tag = await this.findOne(id, userId);

		// Remove tag associations first (cascade should handle this)
		await this.articleTagRepository.delete({ tagId: id });

		// Remove tag
		await this.tagRepository.remove(tag);
	}

	async addTagToArticle(articleId: string, tagId: string, userId: string): Promise<void> {
		// Verify tag exists and belongs to user
		await this.findOne(tagId, userId);

		// Verify article exists and belongs to user
		const article = await this.articleRepository.findOne({
			where: { id: articleId, userId },
		});

		if (!article) {
			throw new ForbiddenException({
				code: ErrorCode.PERMISSION_DENIED,
				message: 'Cannot add tag to article you don\'t own',
			});
		}

		// Check if association already exists
		const existing = await this.articleTagRepository.findOne({
			where: { articleId, tagId },
		});

		if (!existing) {
			const articleTag = this.articleTagRepository.create({
				articleId,
				tagId,
			});
			await this.articleTagRepository.save(articleTag);
		}
	}

	async removeTagFromArticle(articleId: string, tagId: string): Promise<void> {
		await this.articleTagRepository.delete({ articleId, tagId });
	}
}
