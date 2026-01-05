/**
 * ============================================
 * 执行器控制器 - Executor Controller
 * ============================================
 * 
 * 📌 作用：定义代码执行的 HTTP 接口
 */

import { Controller, Post, Get, Body } from '@nestjs/common';
import { ExecutorService } from './executor.service';
import { ExecuteCodeDto, ExecutionResult } from './dto/execute-code.dto';

@Controller('executor')
export class ExecutorController {
	constructor(private readonly executorService: ExecutorService) { }

	/**
	 * POST /executor/run - 执行代码
	 * 
	 * 请求示例：
	 * curl -X POST http://localhost:3000/executor/run \
	 *   -H "Content-Type: application/json" \
	 *   -d '{"code":"console.log(1+1)","language":"javascript"}'
	 * 
	 * 响应示例：
	 * {
	 *   "success": true,
	 *   "output": "2",
	 *   "error": null,
	 *   "executionTime": 12,
	 *   "logs": [...]
	 * }
	 */
	@Post('run')
	async execute(@Body() executeCodeDto: ExecuteCodeDto): Promise<ExecutionResult> {
		return this.executorService.execute(executeCodeDto);
	}

	/**
	 * GET /executor/info - 获取执行器信息
	 * 
	 * 响应示例：
	 * {
	 *   "mode": "dev",
	 *   "supportedLanguages": ["javascript", "typescript", "python", "java"]
	 * }
	 */
	@Get('info')
	getInfo() {
		return {
			mode: this.executorService.getAppMode(),
			supportedLanguages: this.executorService.getSupportedLanguages(),
		};
	}
}
