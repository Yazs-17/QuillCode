// 从 src-backend 复制
import { Module } from '@nestjs/common';
import { ExecutorController } from './executor.controller';
import { ExecutorService } from './executor.service';
import { SandboxExecutor } from './sandbox.executor';

@Module({
	controllers: [ExecutorController],
	providers: [ExecutorService, SandboxExecutor],
	exports: [ExecutorService],
})
export class ExecutorModule { }
