import {
	Injectable,
	NotFoundException,
	ConflictException,
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

	async create(createTagDto: CreateTagDto): Promise<Tag> {
		// Check if tag already exists
		const existingTag = await this.tagRepository.findOne({
			where: { name: createTagDto.name },
		});

		if (existingTag) {
			throw new ConflictException({
				code: ErrorCode.TAG_EXISTS,
				message: ErrorMessages[ErrorCode.TAG_EXISTS],
			});
		}

		const tag = this.tagRepository.create(createTagDto);
		return this.tagRepository.save(tag);
	}

	async findAll(): Promise<(Tag & { articleCount: number })[]> {
		const tags = await this.tagRepository.find({
			order: { name: 'ASC' },
		});

		// Get article counts for each tag
		const tagsWithCount = await Promise.all(
			tags.map(async (tag) => {
				const articleCount = await this.articleTagRepository.count({
					where: { tagId: tag.id },
				});
				return { ...tag, articleCount };
			}),
		);

		return tagsWithCount;
	}

	async findOne(id: string): Promise<Tag> {
		const tag = await this.tagRepository.findOne({
			where: { id },
		});

		if (!tag) {
			throw new NotFoundException({
				code: ErrorCode.TAG_NOT_FOUND,
				message: ErrorMessages[ErrorCode.TAG_NOT_FOUND],
			});
		}

		return tag;
	}

	async findByName(name: string): Promise<Tag | null> {
		return this.tagRepository.findOne({
			where: { name },
		});
	}

	async getArticlesByTag(tagId: string, userId: string): Promise<Article[]> {
		// Verify tag exists
		await this.findOne(tagId);

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

	async remove(id: string): Promise<void> {
		const tag = await this.findOne(id);

		// Remove tag associations first (cascade should handle this)
		await this.articleTagRepository.delete({ tagId: id });

		// Remove tag
		await this.tagRepository.remove(tag);
	}

	async addTagToArticle(articleId: string, tagId: string): Promise<void> {
		// Verify tag exists
		await this.findOne(tagId);

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
