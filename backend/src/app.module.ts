import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  databaseConfig,
  jwtConfig,
  appConfig,
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
        ollamaConfig,
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: configService.get('database.database'),
        entities: [User, Article, Tag, ArticleTag, Share, Comment],
        synchronize: true, // Enable for SQLite to create tables quickly, but better to use migrations in real app
        logging:
          configService.get('app.mode') === 'dev' ? ['error', 'warn'] : false,
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
export class AppModule {}
