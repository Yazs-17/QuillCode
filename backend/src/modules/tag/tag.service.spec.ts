import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { Tag, ArticleTag, Article } from '../../entities';

describe('TagService', () => {
  let service: TagService;

  const mockTagRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockArticleTagRepository = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockArticleRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagService,
        { provide: getRepositoryToken(Tag), useValue: mockTagRepository },
        {
          provide: getRepositoryToken(ArticleTag),
          useValue: mockArticleTagRepository,
        },
        {
          provide: getRepositoryToken(Article),
          useValue: mockArticleRepository,
        },
      ],
    }).compile();

    service = module.get<TagService>(TagService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const userId = 'user-123';
    const createTagDto = { name: 'test-tag' };

    it('should create a tag with userId', async () => {
      const expectedTag = { id: 'tag-1', name: 'test-tag', userId };
      mockTagRepository.findOne.mockResolvedValue(null);
      mockTagRepository.create.mockReturnValue(expectedTag);
      mockTagRepository.save.mockResolvedValue(expectedTag);

      const result = await service.create(createTagDto, userId);

      expect(mockTagRepository.findOne).toHaveBeenCalledWith({
        where: { name: createTagDto.name, userId },
      });
      expect(mockTagRepository.create).toHaveBeenCalledWith({
        ...createTagDto,
        userId,
      });
      expect(result).toEqual(expectedTag);
    });

    it('should throw ConflictException if tag name exists for same user', async () => {
      mockTagRepository.findOne.mockResolvedValue({
        id: 'existing',
        name: 'test-tag',
        userId,
      });

      await expect(service.create(createTagDto, userId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should allow same tag name for different users', async () => {
      const userA = 'user-a';
      const userB = 'user-b';
      const tagForUserA = { id: 'tag-a', name: 'shared-name', userId: userA };
      const tagForUserB = { id: 'tag-b', name: 'shared-name', userId: userB };

      // User A creates tag
      mockTagRepository.findOne.mockResolvedValue(null);
      mockTagRepository.create.mockReturnValue(tagForUserA);
      mockTagRepository.save.mockResolvedValue(tagForUserA);
      await service.create({ name: 'shared-name' }, userA);

      // User B creates tag with same name - should succeed
      mockTagRepository.findOne.mockResolvedValue(null); // No tag with this name for userB
      mockTagRepository.create.mockReturnValue(tagForUserB);
      mockTagRepository.save.mockResolvedValue(tagForUserB);
      const result = await service.create({ name: 'shared-name' }, userB);

      expect(result.userId).toBe(userB);
    });
  });

  describe('findAll', () => {
    const userId = 'user-123';

    it('should return only tags belonging to the user', async () => {
      const userTags = [
        { id: 'tag-1', name: 'tag1', userId },
        { id: 'tag-2', name: 'tag2', userId },
      ];
      mockTagRepository.find.mockResolvedValue(userTags);

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      mockArticleTagRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.findAll(userId);

      expect(mockTagRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { name: 'ASC' },
      });
      expect(result.length).toBe(2);
      result.forEach((tag) => {
        expect(tag.userId).toBe(userId);
      });
    });

    it('should return article counts scoped to user', async () => {
      const userTags = [{ id: 'tag-1', name: 'tag1', userId }];
      mockTagRepository.find.mockResolvedValue(userTags);

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
      };
      mockArticleTagRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.findAll(userId);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'article.userId = :userId',
        { userId },
      );
      expect(result[0].articleCount).toBe(5);
    });
  });

  describe('findOne', () => {
    const userId = 'user-123';
    const tagId = 'tag-123';

    it('should return tag if it belongs to user', async () => {
      const tag = { id: tagId, name: 'test', userId };
      mockTagRepository.findOne.mockResolvedValue(tag);

      const result = await service.findOne(tagId, userId);

      expect(mockTagRepository.findOne).toHaveBeenCalledWith({
        where: { id: tagId, userId },
      });
      expect(result).toEqual(tag);
    });

    it('should throw NotFoundException if tag does not exist', async () => {
      mockTagRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(tagId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if tag belongs to different user', async () => {
      mockTagRepository.findOne.mockResolvedValue(null); // Query with userId filter returns null

      await expect(service.findOne(tagId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    const userId = 'user-123';
    const tagId = 'tag-123';

    it('should remove tag if it belongs to user', async () => {
      const tag = { id: tagId, name: 'test', userId };
      mockTagRepository.findOne.mockResolvedValue(tag);
      mockArticleTagRepository.delete.mockResolvedValue({ affected: 1 });
      mockTagRepository.remove.mockResolvedValue(tag);

      await service.remove(tagId, userId);

      expect(mockTagRepository.findOne).toHaveBeenCalledWith({
        where: { id: tagId, userId },
      });
      expect(mockArticleTagRepository.delete).toHaveBeenCalledWith({ tagId });
      expect(mockTagRepository.remove).toHaveBeenCalledWith(tag);
    });

    it("should throw NotFoundException when trying to delete another user's tag", async () => {
      mockTagRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(tagId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addTagToArticle', () => {
    const userId = 'user-123';
    const tagId = 'tag-123';
    const articleId = 'article-123';

    it('should add tag to article if both belong to user', async () => {
      const tag = { id: tagId, name: 'test', userId };
      const article = { id: articleId, userId };
      mockTagRepository.findOne.mockResolvedValue(tag);
      mockArticleRepository.findOne.mockResolvedValue(article);
      mockArticleTagRepository.findOne.mockResolvedValue(null);
      mockArticleTagRepository.create.mockReturnValue({ articleId, tagId });
      mockArticleTagRepository.save.mockResolvedValue({ articleId, tagId });

      await service.addTagToArticle(articleId, tagId, userId);

      expect(mockTagRepository.findOne).toHaveBeenCalledWith({
        where: { id: tagId, userId },
      });
      expect(mockArticleRepository.findOne).toHaveBeenCalledWith({
        where: { id: articleId, userId },
      });
    });

    it('should throw NotFoundException if tag does not belong to user', async () => {
      mockTagRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addTagToArticle(articleId, tagId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if article does not belong to user', async () => {
      const tag = { id: tagId, name: 'test', userId };
      mockTagRepository.findOne.mockResolvedValue(tag);
      mockArticleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addTagToArticle(articleId, tagId, userId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
