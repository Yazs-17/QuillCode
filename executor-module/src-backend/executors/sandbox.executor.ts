/**
 * ============================================
 * 沙箱执行器 - Sandbox Executor
 * ============================================
 * 
 * 📌 作用：在 Node.js 沙箱环境中安全执行 JS/TS 代码
 * 📌 优点：无需 Docker，启动快，适合 JS/TS
 * 📌 限制：只支持 JavaScript 和 TypeScript
 * 
 * 🔒 安全措施：
 * - 禁用 require, process, global 等危险对象
 * - 禁用 setTimeout, setInterval 等定时器
 * - 禁用 fetch, XMLHttpRequest 等网络请求
 * - 执行超时限制（默认 10 秒）
 */

import { Injectable } from '@nestjs/common';
import { ExecutionResult, ExecutionLog } from '../dto/execute-code.dto';

@Injectable()
export class SandboxExecutor {
	// 执行超时时间（毫秒）
	private readonly TIMEOUT_MS = 10000;

	/**
	 * 执行代码
	 * 
	 * @param code - 要执行的代码
	 * @param language - 编程语言 (javascript | typescript)
	 * @returns 执行结果
	 */
	async execute(code: string, language: string): Promise<ExecutionResult> {
		const startTime = Date.now();
		const logs: ExecutionLog[] = [];

		// 只支持 JS/TS
		if (!['javascript', 'typescript'].includes(language)) {
			return {
				success: false,
				output: '',
				error: `沙箱模式不支持 ${language}，请使用 Docker 模式`,
				executionTime: Date.now() - startTime,
				logs: [],
			};
		}

		try {
			const result = await this.executeInSandbox(code, logs);

			return {
				success: true,
				output: this.formatOutput(logs, result),
				error: null,
				executionTime: Date.now() - startTime,
				logs,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			const errorStack = error instanceof Error ? error.stack : undefined;

			logs.push({
				type: 'error',
				text: errorStack || errorMessage,
				timestamp: Date.now(),
			});

			return {
				success: false,
				output: this.formatOutput(logs),
				error: errorMessage,
				executionTime: Date.now() - startTime,
				logs,
			};
		}
	}

	/**
	 * 在沙箱中执行代码
	 * 
	 * 🔧 工作原理：
	 * 1. 创建一个受限的全局对象（sandbox）
	 * 2. 使用 AsyncFunction 构造函数创建函数
	 * 3. 将 sandbox 中的值作为参数传入，覆盖全局对象
	 */
	private async executeInSandbox(
		code: string,
		logs: ExecutionLog[],
	): Promise<unknown> {
		// 创建安全的 console 代理
		const consoleProxy = this.createConsoleProxy(logs);

		// ===== 创建受限的沙箱环境 =====
		// 将危险的全局对象设为 undefined
		const sandbox = {
			console: consoleProxy,      // 替换为我们的代理
			setTimeout: undefined,      // 🔒 禁用定时器
			setInterval: undefined,     // 🔒 禁用定时器
			setImmediate: undefined,    // 🔒 禁用定时器
			fetch: undefined,           // 🔒 禁用网络请求
			XMLHttpRequest: undefined,  // 🔒 禁用网络请求
			require: undefined,         // 🔒 禁用模块加载
			process: undefined,         // 🔒 禁用进程访问
			global: undefined,          // 🔒 禁用全局对象
			__dirname: undefined,       // 🔒 禁用路径
			__filename: undefined,      // 🔒 禁用路径
			module: undefined,          // 🔒 禁用模块
			exports: undefined,         // 🔒 禁用导出
			Buffer: undefined,          // 🔒 禁用 Buffer
		};

		// 创建异步函数构造器
		const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;

		// 构建函数，将 sandbox 的 key 作为参数名
		const sandboxKeys = Object.keys(sandbox);
		const sandboxValues = Object.values(sandbox);

		const fn = new AsyncFunction(...sandboxKeys, code);

		// 带超时执行
		const result = await Promise.race([
			fn(...sandboxValues),
			this.createTimeout(),
		]);

		return result;
	}

	/**
	 * 创建 console 代理
	 * 拦截所有 console 方法，收集日志
	 */
	private createConsoleProxy(logs: ExecutionLog[]) {
		const collect = (type: ExecutionLog['type'], args: unknown[]) => {
			const text = args.map((item) => this.stringify(item)).join(' ');
			logs.push({
				type,
				text,
				timestamp: Date.now(),
			});
		};

		return {
			log: (...args: unknown[]) => collect('log', args),
			info: (...args: unknown[]) => collect('info', args),
			warn: (...args: unknown[]) => collect('warn', args),
			error: (...args: unknown[]) => collect('error', args),
			debug: (...args: unknown[]) => collect('log', args),
			trace: (...args: unknown[]) => collect('log', args),
		};
	}

	/**
	 * 将任意值转换为字符串
	 */
	private stringify(value: unknown): string {
		if (value instanceof Error) {
			return value.stack || value.message;
		}
		if (typeof value === 'function') {
			return value.toString();
		}
		if (value === undefined) {
			return 'undefined';
		}
		if (value === null) {
			return 'null';
		}
		try {
			return JSON.stringify(value, null, 2);
		} catch {
			return String(value);
		}
	}

	/**
	 * 创建超时 Promise
	 */
	private createTimeout(): Promise<never> {
		return new Promise((_, reject) => {
			setTimeout(() => {
				reject(new Error(`执行超时：超过 ${this.TIMEOUT_MS}ms 限制`));
			}, this.TIMEOUT_MS);
		});
	}

	/**
	 * 格式化输出
	 */
	private formatOutput(logs: ExecutionLog[], result?: unknown): string {
		const outputLines: string[] = [];

		for (const log of logs) {
			const prefix =
				log.type === 'error' ? '[ERROR] ' :
					log.type === 'warn' ? '[WARN] ' :
						log.type === 'info' ? '[INFO] ' : '';
			outputLines.push(`${prefix}${log.text}`);
		}

		if (result !== undefined) {
			outputLines.push(`\n返回值: ${this.stringify(result)}`);
		}

		return outputLines.join('\n');
	}
}
