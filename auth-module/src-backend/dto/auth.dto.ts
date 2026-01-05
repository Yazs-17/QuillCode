/**
 * ============================================
 * 认证 DTO - Data Transfer Objects
 * ============================================
 * 
 * 📌 作用：定义请求参数的验证规则
 * 📌 框架：class-validator
 * 
 * 🔧 自定义指南：
 * - 修改验证规则：调整 MinLength, MaxLength 等
 * - 添加新字段：如注册时添加 phone, nickname 等
 */

import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

/**
 * 注册请求 DTO
 * 
 * 请求示例：
 * POST /auth/register
 * {
 *   "username": "john",
 *   "email": "john@example.com",
 *   "password": "123456"
 * }
 */
export class RegisterDto {
	@IsString()
	@MinLength(3, { message: '用户名至少3个字符' })
	@MaxLength(20, { message: '用户名最多20个字符' })
	username: string;

	@IsEmail({}, { message: '邮箱格式不正确' })
	email: string;

	@IsString()
	@MinLength(6, { message: '密码至少6个字符' })
	@MaxLength(50, { message: '密码最多50个字符' })
	password: string;

	// 🔧 扩展示例：添加手机号
	// @IsOptional()
	// @IsString()
	// @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
	// phone?: string;
}

/**
 * 登录请求 DTO
 * 
 * 请求示例：
 * POST /auth/login
 * {
 *   "username": "john",
 *   "password": "123456"
 * }
 */
export class LoginDto {
	@IsString()
	@MinLength(3)
	username: string;

	@IsString()
	@MinLength(6)
	password: string;
}

/**
 * 登录响应类型
 */
export interface LoginResponse {
	accessToken: string;
	user: {
		id: string;
		username: string;
		email: string;
		role: string;
	};
}

/**
 * 用户信息响应类型
 */
export interface UserProfile {
	id: string;
	username: string;
	email: string;
	role: string;
	createdAt: Date;
	updatedAt: Date;
}
