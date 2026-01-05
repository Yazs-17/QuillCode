import { Controller, Post, Get, Body } from '@nestjs/common';
import { ExecutorService } from './executor.service';
import { ExecuteCodeDto } from './execute-code.dto';

@Controller('executor')
export class ExecutorController {
	constructor(private readonly executorService: ExecutorService) { }

	@Post('run')
	async execute(@Body() dto: ExecuteCodeDto) {
		return this.executorService.execute(dto);
	}

	@Get('info')
	getInfo() {
		return {
			mode: this.executorService.getAppMode(),
			supportedLanguages: this.executorService.getSupportedLanguages(),
		};
	}
}
