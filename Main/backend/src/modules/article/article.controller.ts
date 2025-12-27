import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto, UpdateArticleDto } from './dto';
import { JwtAuthGuard } from '../../common';
import { User } from '../../entities';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('articles')
@UseGuards(JwtAuthGuard)
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  async create(
    @Request() req: RequestWithUser,
    @Body() createArticleDto: CreateArticleDto,
  ) {
    return this.articleService.create(req.user.id, createArticleDto);
  }

  @Get()
  async findAll(@Request() req: RequestWithUser) {
    return this.articleService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    return this.articleService.findOne(id, req.user.id);
  }

  @Put(':id')
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.articleService.update(id, req.user.id, updateArticleDto);
  }

  @Delete(':id')
  async remove(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    await this.articleService.remove(id, req.user.id);
    return { message: 'Article deleted successfully' };
  }
}
