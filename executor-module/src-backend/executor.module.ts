/**
 * ============================================
 * 执行器模块 - Executor Module
 * ============================================
 * 
 * 📌 集成步骤：
 * 1. 在 app.module.ts 中导入此模块
 * 2. 确保 ConfigModule 已配置
 */

import { Module } from '@nestjs/common';
import { ExecutorController } from './executor.controller';
import { ExecutorService } from './executor.service';
import { SandboxExecutor } from './executors/sandbox.executor';
// 🔧 如需 Docker 支持，取消下面的注释
// import { DockerExecutor } from './executors/docker.executor';

@Module({
	controllers: [ExecutorController],
	providers: [
		ExecutorService,
		SandboxExecutor,
		// DockerExecutor,  // 🔧 Docker 支持
	],
	exports: [ExecutorService],
})
export class ExecutorModule { }
