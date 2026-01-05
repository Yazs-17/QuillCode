import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ExecutorModule } from './executor/executor.module';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		ExecutorModule,
	],
})
export class AppModule { }
