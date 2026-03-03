import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { Article, Tag, ArticleTag, Share } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Article, Tag, ArticleTag, Share])],
  controllers: [ArticleController],
  providers: [ArticleService],
  exports: [ArticleService],
})
export class ArticleModule {}
