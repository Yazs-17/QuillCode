/**
 * ============================================
 * 代码执行 DTO
 * ============================================
 * 
 * 📌 作用：定义代码执行请求的参数验证
 */

import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

/**
 * 执行代码请求 DTO
 */
export class ExecuteCodeDto {
	/**
	 * 要执行的代码
	 */
	@IsString()
	@IsNotEmpty({ message: '代码不能为空' })
	code: string;

	/**
	 * 编程语言
	 * 
	 * 🔧 扩展：添加更多语言支持
	 * @IsIn(['javascript', 'typescript', 'python', 'java', 'go', 'rust'])
	 */
	@IsString()
	@IsIn(['javascript', 'typescript', 'python', 'java'], {
		message: '不支持的编程语言',
	})
	language: string;

	/**
	 * 标准输入（可选）
	 * 用于需要用户输入的程序
	 */
	@IsOptional()
	@IsString()
	input?: string;
}

/**
 * 执行结果类型
 */
export interface ExecutionResult {
	/** 是否执行成功 */
	success: boolean;
	/** 输出内容 */
	output: string;
	/** 错误信息 */
	error: string | null;
	/** 执行耗时（毫秒） */
	executionTime: number;
	/** 执行日志 */
	logs: ExecutionLog[];
}

/**
 * 执行日志类型
 */
export interface ExecutionLog {
	/** 日志类型 */
	type: 'log' | 'info' | 'warn' | 'error' | 'result';
	/** 日志内容 */
	text: string;
	/** 时间戳 */
	timestamp: number;
}
