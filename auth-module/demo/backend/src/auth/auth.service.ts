// 从 src-backend 复制的认证服务
// 详细注释请查看 src-backend/auth.service.ts

import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(User)
		private userRepository: Repository<User>,
		private jwtService: JwtService,
	) { }

	async register(registerDto: RegisterDto) {
		const { username, email, password } = registerDto;

		const existingUser = await this.userRepository.findOne({
			where: [{ username }, { email }],
		});

		if (existingUser) {
			throw new ConflictException('用户名或邮箱已被注册');
		}

		const passwordHash = await bcrypt.hash(password, 10);
		const user = this.userRepository.create({ username, email, passwordHash });
		await this.userRepository.save(user);

		return {
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
				createdAt: user.createdAt,
			},
		};
	}

	async login(loginDto: LoginDto) {
		const { username, password } = loginDto;
		const user = await this.userRepository.findOne({ where: { username } });

		if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
			throw new UnauthorizedException('用户名或密码错误');
		}

		const payload = { sub: user.id, username: user.username };
		const accessToken = this.jwtService.sign(payload);

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

	async getProfile(userId: string) {
		const user = await this.userRepository.findOne({ where: { id: userId } });
		if (!user) throw new UnauthorizedException('用户不存在');

		return {
			id: user.id,
			username: user.username,
			email: user.email,
			role: user.role,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		};
	}
}
