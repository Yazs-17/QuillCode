/**
 * ============================================
 * 认证模块 - Auth Module
 * ============================================
 * 
 * 📌 作用：组装认证相关的所有组件
 * 📌 框架：NestJS
 * 
 * 🔧 集成步骤：
 * 1. 在 app.module.ts 中导入此模块
 * 2. 确保 ConfigModule 和 TypeOrmModule 已配置
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from './entities/user.entity';

@Module({
	imports: [
		// ===== 数据库：注册 User 实体 =====
		TypeOrmModule.forFeature([User]),

		// ===== Passport：配置默认策略为 JWT =====
		PassportModule.register({ defaultStrategy: 'jwt' }),

		// ===== JWT：异步配置，从环境变量读取密钥 =====
		JwtModule.registerAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				// JWT 密钥，生产环境务必使用强密钥
				secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
				signOptions: {
					// Token 过期时间
					expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '7d',
				},
			}),
			inject: [ConfigService],
		}),
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy],

	// ===== 导出供其他模块使用 =====
	// 其他模块可以使用 JwtAuthGuard 保护路由
	exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule { }
