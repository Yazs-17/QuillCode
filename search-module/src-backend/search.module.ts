/**
 * ============================================
 * 搜索模块 - Search Module
 * ============================================
 */

import { Module, Global } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Global()  // 全局模块，其他模块可直接注入 SearchService
@Module({
	controllers: [SearchController],
	providers: [SearchService],
	exports: [SearchService],
})
export class SearchModule { }
