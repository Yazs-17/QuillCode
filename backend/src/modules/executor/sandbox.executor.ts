import { Injectable } from '@nestjs/common';
import { ExecutionResult, ExecutionLog } from './dto';

@Injectable()
export class SandboxExecutor {
  private readonly TIMEOUT_MS = 10000; // 10 seconds

  async execute(code: string, language: string): Promise<ExecutionResult> {
    const startTime = Date.now();
    const logs: ExecutionLog[] = [];

    // Only support JavaScript and TypeScript in sandbox mode
    if (!['javascript', 'typescript'].includes(language)) {
      return {
        success: false,
        output: '',
        error: `Language '${language}' is not supported in Prod mode. Only JavaScript and TypeScript are available.`,
        executionTime: Date.now() - startTime,
        logs: [],
      };
    }

    // For TypeScript, we execute as JavaScript (basic transpilation not included)
    // In a real implementation, you might want to add ts-node or similar
    const executableCode = code;

    try {
      const result = await this.executeInSandbox(executableCode, logs);

      return {
        success: true,
        output: this.formatOutput(logs, result),
        error: null,
        executionTime: Date.now() - startTime,
        logs,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
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

  private async executeInSandbox(
    code: string,
    logs: ExecutionLog[],
  ): Promise<unknown> {
    // Create safe console proxy
    const consoleProxy = this.createConsoleProxy(logs);

    // Create restricted global context
    const sandbox = {
      console: consoleProxy,
      setTimeout: undefined,
      setInterval: undefined,
      setImmediate: undefined,
      fetch: undefined,
      XMLHttpRequest: undefined,
      require: undefined,
      process: undefined,
      global: undefined,
      __dirname: undefined,
      __filename: undefined,
      module: undefined,
      exports: undefined,
      Buffer: undefined,
    };

    // Create AsyncFunction constructor
    const AsyncFunction = Object.getPrototypeOf(
      async function () {},
    ).constructor;

    // Build the function with sandbox parameters
    const sandboxKeys = Object.keys(sandbox);
    const sandboxValues = Object.values(sandbox);

    const fn = new AsyncFunction(...sandboxKeys, code);

    // Execute with timeout
    const result = await Promise.race([
      fn(...sandboxValues),
      this.createTimeout(),
    ]);

    return result;
  }

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

  private createTimeout(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(`Execution timeout: exceeded ${this.TIMEOUT_MS}ms limit`),
        );
      }, this.TIMEOUT_MS);
    });
  }

  private formatOutput(logs: ExecutionLog[], result?: unknown): string {
    const outputLines: string[] = [];

    for (const log of logs) {
      const prefix =
        log.type === 'error'
          ? '[ERROR] '
          : log.type === 'warn'
            ? '[WARN] '
            : log.type === 'info'
              ? '[INFO] '
              : '';
      outputLines.push(`${prefix}${log.text}`);
    }

    if (result !== undefined) {
      outputLines.push(`\n返回值: ${this.stringify(result)}`);
    }

    return outputLines.join('\n');
  }
}
