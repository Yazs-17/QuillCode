import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { Tag, ArticleTag, Article } from '../../entities';

@Module({
	imports: [TypeOrmModule.forFeature([Tag, ArticleTag, Article])],
	controllers: [TagController],
	providers: [TagService],
	exports: [TagService],
})
export class TagModule { }
