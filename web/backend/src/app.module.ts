import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
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
import {
  initializeSqliteDatabase,
  needsInitialization,
} from './config/sqlite-initializer';

const entities = [User, Article, Tag, ArticleTag, Share, Comment];

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
      useFactory: async (
        configService: ConfigService,
      ): Promise<DataSourceOptions> => {
        const dbType = configService.get<string>('database.type');
        const logger = new Logger('DatabaseConfig');

        if (dbType === 'sqlite') {
          const sqlitePath =
            configService.get<string>('database.sqlitePath') ||
            './data/quillcode.db';
          logger.log(`Configuring SQLite database at: ${sqlitePath}`);

          // Initialize SQLite database if needed
          if (needsInitialization(sqlitePath)) {
            await initializeSqliteDatabase(sqlitePath);
          }

          return {
            type: 'better-sqlite3',
            database: sqlitePath,
            entities,
            synchronize: false, // We use our own init script
            logging:
              configService.get('app.mode') === 'dev'
                ? ['error', 'warn']
                : false,
          };
        }

        // MySQL configuration (default)
        logger.log('Configuring MySQL database');
        return {
          type: 'mysql',
          host: configService.get('database.host'),
          port: configService.get('database.port'),
          username: configService.get('database.username'),
          password: configService.get('database.password'),
          database: configService.get('database.database'),
          entities,
          synchronize: false,
          logging:
            configService.get('app.mode') === 'dev' ? ['error', 'warn'] : false,
          charset: 'utf8mb4',
        };
      },
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
