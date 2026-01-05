/**
 * ============================================
 * Demo 应用模块
 * ============================================
 * 
 * 这是一个完整的 Demo，展示如何集成 AuthModule
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// ===== 导入 Auth 模块 =====
// 实际项目中，从 src-backend 复制文件后这样导入：
// import { AuthModule } from './modules/auth/auth.module';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/entities/user.entity';

@Module({
	imports: [
		// ===== 配置模块：读取 .env 文件 =====
		ConfigModule.forRoot({
			isGlobal: true,  // 全局可用，无需在每个模块导入
		}),

		// ===== 数据库配置：使用 SQLite（Demo 用） =====
		// 生产环境建议使用 MySQL/PostgreSQL
		TypeOrmModule.forRoot({
			type: 'sqlite',
			database: 'demo.db',        // 数据库文件
			entities: [User],           // 实体列表
			synchronize: true,          // 自动同步表结构（仅开发环境）
			logging: true,              // 打印 SQL 日志
		}),

		// ===== Auth 模块 =====
		AuthModule,
	],
})
export class AppModule { }
