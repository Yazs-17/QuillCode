import { Module } from '@nestjs/common';
import { ExecutorController } from './executor.controller';
import { ExecutorService } from './executor.service';
import { SandboxExecutor } from './sandbox.executor';
import { DockerExecutor } from './docker.executor';

@Module({
  controllers: [ExecutorController],
  providers: [ExecutorService, SandboxExecutor, DockerExecutor],
  exports: [ExecutorService],
})
export class ExecutorModule {}
