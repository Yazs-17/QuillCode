import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { RecommendService } from './recommend.service';
import { Article, ArticleTag } from '../../entities';

@Global()
@Module({
	imports: [TypeOrmModule.forFeature([Article, ArticleTag])],
	controllers: [SearchController],
	providers: [SearchService, RecommendService],
	exports: [SearchService, RecommendService],
})
export class SearchModule { }
