import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  GoneException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Share, Article } from '../../entities';
import { CreateShareDto } from './dto';
import { ErrorCode, ErrorMessages } from '../../common';

@Injectable()
export class ShareService {
  constructor(
    @InjectRepository(Share)
    private shareRepository: Repository<Share>,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
  ) {}

  async create(userId: string, createShareDto: CreateShareDto): Promise<Share> {
    const { articleId, expiresInDays = 7 } = createShareDto;

    // Verify article exists and belongs to user
    const article = await this.articleRepository.findOne({
      where: { id: articleId, userId },
    });

    if (!article) {
      throw new NotFoundException({
        code: ErrorCode.ARTICLE_NOT_FOUND,
        message: ErrorMessages[ErrorCode.ARTICLE_NOT_FOUND],
      });
    }

    // Generate unique token
    const token = this.generateToken();

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const share = this.shareRepository.create({
      articleId,
      token,
      expiresAt,
    });

    return this.shareRepository.save(share);
  }

  async findByToken(token: string): Promise<Share> {
    const share = await this.shareRepository.findOne({
      where: { token },
      relations: [
        'article',
        'article.user',
        'article.articleTags',
        'article.articleTags.tag',
      ],
    });

    if (!share) {
      throw new NotFoundException({
        code: ErrorCode.SHARE_NOT_FOUND,
        message: ErrorMessages[ErrorCode.SHARE_NOT_FOUND],
      });
    }

    // Check if expired
    if (this.isExpired(share)) {
      throw new GoneException({
        code: ErrorCode.SHARE_EXPIRED,
        message: ErrorMessages[ErrorCode.SHARE_EXPIRED],
      });
    }

    return share;
  }

  async findAllByUser(userId: string): Promise<Share[]> {
    return this.shareRepository.find({
      where: { article: { userId } },
      relations: ['article'],
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const share = await this.shareRepository.findOne({
      where: { id },
      relations: ['article'],
    });

    if (!share) {
      throw new NotFoundException({
        code: ErrorCode.SHARE_NOT_FOUND,
        message: ErrorMessages[ErrorCode.SHARE_NOT_FOUND],
      });
    }

    // Verify ownership
    if (share.article.userId !== userId) {
      throw new ForbiddenException({
        code: ErrorCode.PERMISSION_DENIED,
        message: ErrorMessages[ErrorCode.PERMISSION_DENIED],
      });
    }

    await this.shareRepository.remove(share);
  }

  isExpired(share: Share): boolean {
    return new Date() > new Date(share.expiresAt);
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }
}
