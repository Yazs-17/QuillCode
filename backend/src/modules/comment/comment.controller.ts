import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto';

@Controller('shares/:token/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  async create(
    @Param('token') token: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentService.create(token, createCommentDto);
  }

  @Get()
  async findAll(@Param('token') token: string) {
    return this.commentService.findByShareToken(token);
  }
}
