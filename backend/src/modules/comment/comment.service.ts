import { Injectable, NotFoundException, GoneException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment, Share } from '../../entities';
import { CreateCommentDto } from './dto';
import { ErrorCode, ErrorMessages } from '../../common';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Share)
    private shareRepository: Repository<Share>,
  ) {}

  async create(
    token: string,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    // Find share by token
    const share = await this.shareRepository.findOne({
      where: { token },
    });

    if (!share) {
      throw new NotFoundException({
        code: ErrorCode.SHARE_NOT_FOUND,
        message: ErrorMessages[ErrorCode.SHARE_NOT_FOUND],
      });
    }

    // Check if share is expired
    if (this.isShareExpired(share)) {
      throw new GoneException({
        code: ErrorCode.SHARE_EXPIRED,
        message: ErrorMessages[ErrorCode.SHARE_EXPIRED],
      });
    }

    const comment = this.commentRepository.create({
      shareId: share.id,
      authorName: createCommentDto.authorName,
      content: createCommentDto.content,
    });

    return this.commentRepository.save(comment);
  }

  async findByShareToken(token: string): Promise<Comment[]> {
    // Find share by token
    const share = await this.shareRepository.findOne({
      where: { token },
    });

    if (!share) {
      throw new NotFoundException({
        code: ErrorCode.SHARE_NOT_FOUND,
        message: ErrorMessages[ErrorCode.SHARE_NOT_FOUND],
      });
    }

    // If share is expired, return empty array (comments are hidden)
    if (this.isShareExpired(share)) {
      return [];
    }

    return this.commentRepository.find({
      where: { shareId: share.id },
      order: { createdAt: 'ASC' },
    });
  }

  private isShareExpired(share: Share): boolean {
    return new Date() > new Date(share.expiresAt);
  }
}
