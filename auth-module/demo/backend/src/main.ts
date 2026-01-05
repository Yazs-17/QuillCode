/**
 * ============================================
 * Demo 入口文件
 * ============================================
 * 
 * 启动命令：npm run start:dev
 * 访问地址：http://localhost:3000
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// 启用 CORS（允许前端跨域访问）
	app.enableCors({
		origin: ['http://localhost:5173', 'http://localhost:3001'],
		credentials: true,
	});

	// 全局验证管道（自动验证 DTO）
	app.useGlobalPipes(new ValidationPipe({
		whitelist: true,      // 自动剔除非 DTO 定义的字段
		transform: true,      // 自动类型转换
		forbidNonWhitelisted: true,  // 存在非白名单字段时报错
	}));

	const port = process.env.PORT || 3000;
	await app.listen(port);

	console.log(`
  ╔════════════════════════════════════════════╗
  ║     Auth Module Demo - Backend Started     ║
  ╠════════════════════════════════════════════╣
  ║  🚀 Server: http://localhost:${port}           ║
  ║                                            ║
  ║  📝 API Endpoints:                         ║
  ║  POST /auth/register  - 用户注册           ║
  ║  POST /auth/login     - 用户登录           ║
  ║  GET  /auth/profile   - 获取用户信息       ║
  ╚════════════════════════════════════════════╝
  `);
}

bootstrap();
