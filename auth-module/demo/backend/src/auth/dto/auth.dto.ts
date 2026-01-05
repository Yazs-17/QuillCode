// 从 src-backend 复制的 DTO
// 详细注释请查看 src-backend/dto/auth.dto.ts

import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

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
}

export class LoginDto {
	@IsString()
	@MinLength(3)
	username: string;

	@IsString()
	@MinLength(6)
	password: string;
}
