// 简化版沙箱执行器 - 详细注释请查看 src-backend/executors/sandbox.executor.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class SandboxExecutor {
	private readonly TIMEOUT_MS = 10000;

	async execute(code: string, language: string) {
		const startTime = Date.now();
		const logs: any[] = [];

		if (!['javascript', 'typescript'].includes(language)) {
			return { success: false, output: '', error: `不支持 ${language}`, executionTime: 0, logs: [] };
		}

		try {
			const consoleProxy = {
				log: (...args) => logs.push({ type: 'log', text: args.map(a => JSON.stringify(a)).join(' '), timestamp: Date.now() }),
				error: (...args) => logs.push({ type: 'error', text: args.map(a => JSON.stringify(a)).join(' '), timestamp: Date.now() }),
				warn: (...args) => logs.push({ type: 'warn', text: args.map(a => JSON.stringify(a)).join(' '), timestamp: Date.now() }),
				info: (...args) => logs.push({ type: 'info', text: args.map(a => JSON.stringify(a)).join(' '), timestamp: Date.now() }),
			};

			const sandbox = { console: consoleProxy, setTimeout: undefined, setInterval: undefined, fetch: undefined, require: undefined, process: undefined };
			const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
			const fn = new AsyncFunction(...Object.keys(sandbox), code);

			await Promise.race([
				fn(...Object.values(sandbox)),
				new Promise((_, reject) => setTimeout(() => reject(new Error('执行超时')), this.TIMEOUT_MS)),
			]);

			return {
				success: true,
				output: logs.map(l => l.text).join('\n'),
				error: null,
				executionTime: Date.now() - startTime,
				logs,
			};
		} catch (error) {
			return {
				success: false,
				output: logs.map(l => l.text).join('\n'),
				error: error.message,
				executionTime: Date.now() - startTime,
				logs,
			};
		}
	}
}
