import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SandboxExecutor } from './sandbox.executor';
import { ExecuteCodeDto } from './execute-code.dto';

@Injectable()
export class ExecutorService {
	private readonly appMode: string;

	constructor(
		private readonly configService: ConfigService,
		private readonly sandboxExecutor: SandboxExecutor,
	) {
		this.appMode = this.configService.get<string>('APP_MODE') || 'dev';
	}

	async execute(dto: ExecuteCodeDto) {
		const { code, language } = dto;

		if (!['javascript', 'typescript'].includes(language)) {
			throw new HttpException(
				{ message: `Demo 仅支持 JavaScript 和 TypeScript` },
				HttpStatus.BAD_REQUEST,
			);
		}

		return this.sandboxExecutor.execute(code, language);
	}

	getAppMode() { return this.appMode; }
	getSupportedLanguages() { return ['javascript', 'typescript']; }
}
