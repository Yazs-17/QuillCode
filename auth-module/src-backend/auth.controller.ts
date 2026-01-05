/**
 * ============================================
 * 认证控制器 - Auth Controller
 * ============================================
 * 
 * 📌 作用：定义 HTTP 接口路由
 * 📌 框架：NestJS
 * 
 * 🔧 自定义指南：
 * - 添加新接口：如 /auth/logout, /auth/refresh
 * - 修改路由前缀：@Controller('api/auth')
 */

import {
	Controller,
	Post,
	Get,
	Body,
	UseGuards,
	Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')  // 路由前缀: /auth
export class AuthController {
	constructor(private readonly authService: AuthService) { }

	/**
	 * ========================================
	 * POST /auth/register - 用户注册
	 * ========================================
	 * 
	 * 请求示例：
	 * curl -X POST http://localhost:3000/auth/register \
	 *   -H "Content-Type: application/json" \
	 *   -d '{"username":"john","email":"john@test.com","password":"123456"}'
	 * 
	 * 响应示例：
	 * {
	 *   "user": {
	 *     "id": "uuid-xxx",
	 *     "username": "john",
	 *     "email": "john@test.com",
	 *     "createdAt": "2024-01-01T00:00:00.000Z"
	 *   }
	 * }
	 */
	@Post('register')
	async register(@Body() registerDto: RegisterDto) {
		return this.authService.register(registerDto);
	}

	/**
	 * ========================================
	 * POST /auth/login - 用户登录
	 * ========================================
	 * 
	 * 请求示例：
	 * curl -X POST http://localhost:3000/auth/login \
	 *   -H "Content-Type: application/json" \
	 *   -d '{"username":"john","password":"123456"}'
	 * 
	 * 响应示例：
	 * {
	 *   "accessToken": "eyJhbGciOiJIUzI1NiIs...",
	 *   "user": {
	 *     "id": "uuid-xxx",
	 *     "username": "john",
	 *     "email": "john@test.com",
	 *     "role": "user"
	 *   }
	 * }
	 */
	@Post('login')
	async login(@Body() loginDto: LoginDto) {
		return this.authService.login(loginDto);
	}

	/**
	 * ========================================
	 * GET /auth/profile - 获取当前用户信息
	 * ========================================
	 * 
	 * ⚠️ 需要认证：请求头需携带 Authorization: Bearer <token>
	 * 
	 * 请求示例：
	 * curl http://localhost:3000/auth/profile \
	 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
	 * 
	 * 响应示例：
	 * {
	 *   "id": "uuid-xxx",
	 *   "username": "john",
	 *   "email": "john@test.com",
	 *   "role": "user",
	 *   "createdAt": "2024-01-01T00:00:00.000Z",
	 *   "updatedAt": "2024-01-01T00:00:00.000Z"
	 * }
	 */
	@UseGuards(JwtAuthGuard)  // 🔒 需要 JWT 认证
	@Get('profile')
	async getProfile(@Request() req: { user: { id: string } }) {
		// req.user 由 JwtStrategy 注入，包含从 token 解析的用户信息
		return this.authService.getProfile(req.user.id);
	}

	// ========================================
	// 🔧 可扩展接口示例
	// ========================================

	/**
	 * POST /auth/logout - 登出（示例）
	 * 
	 * @Post('logout')
	 * @UseGuards(JwtAuthGuard)
	 * async logout(@Request() req) {
	 *   // 如果使用 Redis 存储 token，这里可以将 token 加入黑名单
	 *   // await this.authService.invalidateToken(req.user.id);
	 *   return { message: '登出成功' };
	 * }
	 */

	/**
	 * POST /auth/refresh - 刷新 Token（示例）
	 * 
	 * @Post('refresh')
	 * @UseGuards(JwtAuthGuard)
	 * async refresh(@Request() req) {
	 *   return this.authService.refreshToken(req.user.id);
	 * }
	 */
}
