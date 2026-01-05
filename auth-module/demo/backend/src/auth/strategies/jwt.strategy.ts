// 从 src-backend 复制的 JWT 策略
// 详细注释请查看 src-backend/strategies/jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		configService: ConfigService,
		@InjectRepository(User)
		private userRepository: Repository<User>,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: configService.get<string>('JWT_SECRET') || 'demo-secret',
		});
	}

	async validate(payload: { sub: string; username: string }) {
		const user = await this.userRepository.findOne({ where: { id: payload.sub } });
		if (!user) throw new UnauthorizedException('用户不存在');
		return user;
	}
}
