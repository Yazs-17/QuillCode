import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
	databaseConfig,
	jwtConfig,
	appConfig,
	elasticsearchConfig,
	ollamaConfig,
} from './config';
import { User, Article, Tag, ArticleTag, Share, Comment } from './entities';
import {
	AuthModule,
	ArticleModule,
	ExecutorModule,
	TagModule,
	SearchModule,
	ShareModule,
	CommentModule,
} from './modules';
import { AdminModule } from './modules/admin';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [
				databaseConfig,
				jwtConfig,
				appConfig,
				elasticsearchConfig,
				ollamaConfig,
			],
		}),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				type: 'mysql',
				host: configService.get('database.host'),
				port: configService.get('database.port'),
				username: configService.get('database.username'),
				password: configService.get('database.password'),
				database: configService.get('database.database'),
				entities: [User, Article, Tag, ArticleTag, Share, Comment],
				// synchronize: configService.get('app.mode') === 'dev', // Only in dev mode
				// synchronize: true 只能同步表结构，不能处理视图/存储过程/触发器, 且它可能会和手动创建的表结构冲突
				synchronize: false,
				// logging: configService.get('app.mode') === 'dev',
				logging: configService.get('app.mode') === 'dev' ? ['error', 'warn'] : false,
				charset: 'utf8mb4',
			}),
			inject: [ConfigService],
		}),
		AuthModule,
		ArticleModule,
		ExecutorModule,
		TagModule,
		SearchModule,
		ShareModule,
		CommentModule,
		AdminModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule { }
