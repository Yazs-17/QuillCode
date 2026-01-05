/**
 * ============================================
 * JWT 策略 - JWT Strategy
 * ============================================
 * 
 * 📌 作用：验证 JWT token 并提取用户信息
 * 📌 框架：Passport.js
 * 
 * 工作流程：
 * 1. 从请求头 Authorization: Bearer <token> 提取 token
 * 2. 验证 token 签名和有效期
 * 3. 从 token 中提取 payload
 * 4. 调用 validate() 方法，返回值会被注入到 req.user
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

/**
 * JWT Payload 类型定义
 * 这是存储在 token 中的数据结构
 */
export interface JwtPayload {
	sub: string;      // 用户 ID（JWT 标准字段）
	username: string; // 用户名
	iat?: number;     // 签发时间（自动添加）
	exp?: number;     // 过期时间（自动添加）
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		configService: ConfigService,
		@InjectRepository(User)
		private userRepository: Repository<User>,
	) {
		// 获取 JWT 密钥
		const secret = configService.get<string>('JWT_SECRET') || 'your-secret-key';

		super({
			// ===== Token 提取方式 =====
			// 从 Authorization 请求头提取 Bearer token
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

			// ===== 是否忽略过期 =====
			// false = 过期的 token 会被拒绝
			ignoreExpiration: false,

			// ===== 验证签名的密钥 =====
			secretOrKey: secret,
		});
	}

	/**
	 * ========================================
	 * 验证回调 - 每次请求都会调用
	 * ========================================
	 * 
	 * @param payload - 从 token 中解析出的数据
	 * @returns 返回值会被注入到 req.user
	 * 
	 * 🔧 自定义指南：
	 * - 可以在这里添加额外的验证逻辑
	 * - 如检查用户是否被禁用、token 是否在黑名单等
	 */
	async validate(payload: JwtPayload): Promise<User> {
		// 根据 token 中的用户 ID 查询数据库
		const user = await this.userRepository.findOne({
			where: { id: payload.sub },
		});

		// 用户不存在（可能已被删除）
		if (!user) {
			throw new UnauthorizedException('用户不存在或已被删除');
		}

		// 🔧 扩展示例：检查用户是否被禁用
		// if (!user.isActive) {
		//   throw new UnauthorizedException('账号已被禁用');
		// }

		// 返回用户对象，会被注入到 req.user
		return user;
	}
}
