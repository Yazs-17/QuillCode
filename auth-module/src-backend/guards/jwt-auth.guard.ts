/**
 * ============================================
 * JWT 认证守卫 - JWT Auth Guard
 * ============================================
 * 
 * 📌 作用：保护需要认证的路由
 * 📌 框架：NestJS + Passport
 * 
 * 使用方式：
 * @UseGuards(JwtAuthGuard)
 * @Get('protected')
 * async protectedRoute(@Request() req) {
 *   return req.user;  // 已认证的用户信息
 * }
 */

import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	/**
	 * 判断是否允许访问
	 * 
	 * 🔧 扩展示例：添加白名单路由
	 * 
	 * canActivate(context: ExecutionContext) {
	 *   const request = context.switchToHttp().getRequest();
	 *   
	 *   // 白名单路由不需要认证
	 *   const whitelist = ['/health', '/public'];
	 *   if (whitelist.includes(request.path)) {
	 *     return true;
	 *   }
	 *   
	 *   return super.canActivate(context);
	 * }
	 */
	canActivate(context: ExecutionContext) {
		return super.canActivate(context);
	}
}
