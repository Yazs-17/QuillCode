/**
 * ============================================
 * 执行器服务 - Executor Service
 * ============================================
 * 
 * 📌 作用：统一管理代码执行，自动选择执行器
 * 📌 策略：
 *   - JS/TS → 沙箱执行器（快速）
 *   - Python/Java → Docker 执行器（需要 Docker）
 */

import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SandboxExecutor } from './executors/sandbox.executor';
import { ExecuteCodeDto, ExecutionResult } from './dto/execute-code.dto';

@Injectable()
export class ExecutorService {
	private readonly logger = new Logger(ExecutorService.name);
	private readonly appMode: string;

	constructor(
		private readonly configService: ConfigService,
		private readonly sandboxExecutor: SandboxExecutor,
		// 🔧 如需 Docker 支持，取消下面的注释
		// private readonly dockerExecutor: DockerExecutor,
	) {
		// dev 模式支持所有语言，prod 模式只支持 JS/TS
		this.appMode = this.configService.get<string>('APP_MODE') || 'dev';
	}

	/**
	 * 执行代码
	 * 
	 * @param executeCodeDto - 执行参数
	 * @returns 执行结果
	 */
	async execute(executeCodeDto: ExecuteCodeDto): Promise<ExecutionResult> {
		const { code, language } = executeCodeDto;

		this.logger.log(`执行 ${language} 代码，模式: ${this.appMode}`);

		// ===== 生产模式限制 =====
		if (this.appMode === 'prod') {
			if (!['javascript', 'typescript'].includes(language)) {
				throw new HttpException(
					{
						message: `生产模式不支持 ${language}，仅支持 JavaScript 和 TypeScript`,
					},
					HttpStatus.BAD_REQUEST,
				);
			}
		}

		try {
			// ===== 选择执行器 =====
			// JS/TS 使用沙箱（快速，无需 Docker）
			if (['javascript', 'typescript'].includes(language)) {
				return await this.sandboxExecutor.execute(code, language);
			}

			// 其他语言需要 Docker
			// 🔧 如需 Docker 支持，取消下面的注释
			// return await this.dockerExecutor.execute(code, language, input);

			throw new HttpException(
				{ message: `${language} 需要 Docker 支持，请配置 DockerExecutor` },
				HttpStatus.SERVICE_UNAVAILABLE,
			);
		} catch (error) {
			// 重新抛出 HttpException
			if (error instanceof HttpException) {
				throw error;
			}

			// 处理超时错误
			if (error instanceof Error && error.message.includes('超时')) {
				throw new HttpException(
					{ message: '代码执行超时' },
					HttpStatus.REQUEST_TIMEOUT,
				);
			}

			// 其他错误
			throw new HttpException(
				{ message: error instanceof Error ? error.message : '执行错误' },
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * 获取当前模式
	 */
	getAppMode(): string {
		return this.appMode;
	}

	/**
	 * 获取支持的语言列表
	 */
	getSupportedLanguages(): string[] {
		if (this.appMode === 'prod') {
			return ['javascript', 'typescript'];
		}
		return ['javascript', 'typescript', 'python', 'java'];
	}
}
