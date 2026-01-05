/**
 * ============================================
 * 认证服务 - Auth Service
 * ============================================
 * 
 * 📌 作用：处理用户注册、登录、获取信息的核心业务逻辑
 * 📌 框架：NestJS
 * 
 * 🔧 自定义指南：
 * - 修改密码加密强度：调整 saltRounds
 * - 添加登录限制：实现登录失败次数限制
 * - 添加邮箱验证：注册后发送验证邮件
 */

import {
	Injectable,
	ConflictException,
	UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RegisterDto, LoginDto, LoginResponse, UserProfile } from './dto/auth.dto';

@Injectable()
export class AuthService {
	constructor(
		// 注入 User 仓库，用于数据库操作
		@InjectRepository(User)
		private userRepository: Repository<User>,

		// 注入 JWT 服务，用于生成 token
		private jwtService: JwtService,
	) { }

	/**
	 * ========================================
	 * 用户注册
	 * ========================================
	 * 
	 * 流程：
	 * 1. 检查用户名/邮箱是否已存在
	 * 2. 使用 bcrypt 加密密码
	 * 3. 创建用户记录
	 * 4. 返回用户信息（不含密码）
	 * 
	 * @param registerDto - 注册信息
	 * @returns 新创建的用户信息
	 */
	async register(registerDto: RegisterDto): Promise<{ user: Partial<User> }> {
		const { username, email, password } = registerDto;

		// ===== 步骤1: 检查用户是否已存在 =====
		const existingUser = await this.userRepository.findOne({
			where: [
				{ username },  // 用户名已存在
				{ email },     // 或邮箱已存在
			],
		});

		if (existingUser) {
			throw new ConflictException('用户名或邮箱已被注册');
		}

		// ===== 步骤2: 密码加密 =====
		// saltRounds 越大越安全，但也越慢，推荐 10-12
		const saltRounds = 10;
		const passwordHash = await bcrypt.hash(password, saltRounds);

		// ===== 步骤3: 创建用户 =====
		const user = this.userRepository.create({
			username,
			email,
			passwordHash,
		});

		await this.userRepository.save(user);

		// ===== 步骤4: 返回用户信息（排除密码） =====
		return {
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
				createdAt: user.createdAt,
			},
		};
	}

	/**
	 * ========================================
	 * 用户登录
	 * ========================================
	 * 
	 * 流程：
	 * 1. 根据用户名查找用户
	 * 2. 验证密码
	 * 3. 生成 JWT token
	 * 4. 返回 token 和用户信息
	 * 
	 * @param loginDto - 登录信息
	 * @returns JWT token 和用户信息
	 */
	async login(loginDto: LoginDto): Promise<LoginResponse> {
		const { username, password } = loginDto;

		// ===== 步骤1: 查找用户 =====
		const user = await this.userRepository.findOne({
			where: { username },
		});

		if (!user) {
			throw new UnauthorizedException('用户名或密码错误');
		}

		// ===== 步骤2: 验证密码 =====
		const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

		if (!isPasswordValid) {
			throw new UnauthorizedException('用户名或密码错误');
		}

		// ===== 步骤3: 生成 JWT token =====
		// payload 中存储用户标识信息
		const payload = {
			sub: user.id,        // sub 是 JWT 标准字段，表示主体
			username: user.username
		};
		const accessToken = this.jwtService.sign(payload);

		// ===== 步骤4: 返回结果 =====
		return {
			accessToken,
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
				role: user.role,
			},
		};
	}

	/**
	 * ========================================
	 * 获取用户信息
	 * ========================================
	 * 
	 * @param userId - 用户 ID（从 JWT token 中解析）
	 * @returns 用户详细信息
	 */
	async getProfile(userId: string): Promise<UserProfile> {
		const user = await this.userRepository.findOne({
			where: { id: userId },
		});

		if (!user) {
			throw new UnauthorizedException('用户不存在');
		}

		// 返回用户信息（排除密码）
		return {
			id: user.id,
			username: user.username,
			email: user.email,
			role: user.role,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		};
	}

	// ========================================
	// 🔧 可扩展方法示例
	// ========================================

	/**
	 * 修改密码（示例）
	 * 
	 * async changePassword(userId: string, oldPassword: string, newPassword: string) {
	 *   const user = await this.userRepository.findOne({ where: { id: userId } });
	 *   
	 *   // 验证旧密码
	 *   const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
	 *   if (!isValid) throw new UnauthorizedException('原密码错误');
	 *   
	 *   // 更新新密码
	 *   user.passwordHash = await bcrypt.hash(newPassword, 10);
	 *   await this.userRepository.save(user);
	 * }
	 */

	/**
	 * 刷新 Token（示例）
	 * 
	 * async refreshToken(userId: string) {
	 *   const user = await this.userRepository.findOne({ where: { id: userId } });
	 *   const payload = { sub: user.id, username: user.username };
	 *   return { accessToken: this.jwtService.sign(payload) };
	 * }
	 */
}
