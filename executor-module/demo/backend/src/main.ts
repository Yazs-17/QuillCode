import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors();
	app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

	await app.listen(3000);
	console.log(`
  ╔════════════════════════════════════════════╗
  ║   Executor Module Demo - Backend Started   ║
  ╠════════════════════════════════════════════╣
  ║  🚀 Server: http://localhost:3000          ║
  ║                                            ║
  ║  📝 API Endpoints:                         ║
  ║  POST /executor/run   - 执行代码           ║
  ║  GET  /executor/info  - 获取支持的语言     ║
  ╚════════════════════════════════════════════╝
  `);
}
bootstrap();
