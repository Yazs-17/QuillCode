import { Injectable, Logger } from '@nestjs/common';
import Docker from 'dockerode';
import { ExecutionResult, ExecutionLog } from './dto';

interface LanguageConfig {
  image: string;
  command: (code: string, input?: string) => string[];
  fileExtension: string;
}

@Injectable()
export class DockerExecutor {
  private readonly logger = new Logger(DockerExecutor.name);
  private readonly docker: Docker;
  private readonly TIMEOUT_MS = 10000; // 10 seconds
  private readonly MEMORY_LIMIT = 128 * 1024 * 1024; // 128MB
  private readonly CPU_PERIOD = 100000;
  private readonly CPU_QUOTA = 50000; // 50% CPU

  private readonly languageConfigs: Record<string, LanguageConfig> = {
    javascript: {
      image: 'node:18-alpine',
      command: (code: string) => ['node', '-e', code],
      fileExtension: 'js',
    },
    typescript: {
      image: 'node:18-alpine',
      command: (code: string) => ['node', '-e', code],
      fileExtension: 'ts',
    },
    python: {
      image: 'python:3.11-alpine',
      command: (code: string) => ['python', '-c', code],
      fileExtension: 'py',
    },
    java: {
      image: 'openjdk:17-alpine',
      command: (code: string) => [
        'sh',
        '-c',
        `echo '${this.escapeShell(code)}' > Main.java && javac Main.java && java Main`,
      ],
      fileExtension: 'java',
    },
  };

  constructor() {
    // Initialize Docker client
    // On Windows, use named pipe; on Unix, use socket
    const isWindows = process.platform === 'win32';
    this.docker = new Docker(
      isWindows
        ? { socketPath: '//./pipe/docker_engine' }
        : { socketPath: '/var/run/docker.sock' },
    );
  }

  async execute(
    code: string,
    language: string,
    input?: string,
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const logs: ExecutionLog[] = [];

    const config = this.languageConfigs[language];
    if (!config) {
      return {
        success: false,
        output: '',
        error: `Language '${language}' is not supported. Supported languages: ${Object.keys(this.languageConfigs).join(', ')}`,
        executionTime: Date.now() - startTime,
        logs: [],
      };
    }

    let container: Docker.Container | null = null;

    try {
      // Check if Docker is available
      await this.docker.ping();

      // Ensure image exists (pull if necessary)
      await this.ensureImage(config.image);

      // Create container with resource limits and network isolation
      container = await this.docker.createContainer({
        Image: config.image,
        Cmd: config.command(code, input),
        Tty: false,
        NetworkDisabled: true, // Network isolation
        HostConfig: {
          Memory: this.MEMORY_LIMIT,
          MemorySwap: this.MEMORY_LIMIT, // Disable swap
          CpuPeriod: this.CPU_PERIOD,
          CpuQuota: this.CPU_QUOTA,
          AutoRemove: false, // We'll remove manually after getting logs
          ReadonlyRootfs: false, // Java needs to write class files
        },
      });

      // Start container
      await container.start();

      // Wait for container with timeout
      const waitPromise = container.wait();
      const timeoutPromise = new Promise<{ StatusCode: number }>(
        (_, reject) => {
          setTimeout(async () => {
            try {
              if (container) {
                await container.kill();
              }
            } catch {
              // Container might have already stopped
            }
            reject(
              new Error(
                `Execution timeout: exceeded ${this.TIMEOUT_MS}ms limit`,
              ),
            );
          }, this.TIMEOUT_MS);
        },
      );

      const result = await Promise.race([waitPromise, timeoutPromise]);

      // Get container logs
      const logStream = await container.logs({
        stdout: true,
        stderr: true,
        follow: false,
      });

      const { stdout, stderr } = this.parseDockerLogs(logStream);

      // Add logs
      if (stdout) {
        logs.push({
          type: 'log',
          text: stdout,
          timestamp: Date.now(),
        });
      }

      if (stderr) {
        logs.push({
          type: 'error',
          text: stderr,
          timestamp: Date.now(),
        });
      }

      const success = result.StatusCode === 0;

      return {
        success,
        output: this.formatOutput(logs),
        error: success
          ? null
          : stderr || `Process exited with code ${result.StatusCode}`,
        executionTime: Date.now() - startTime,
        logs,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(`Docker execution error: ${errorMessage}`);

      logs.push({
        type: 'error',
        text: errorMessage,
        timestamp: Date.now(),
      });

      return {
        success: false,
        output: this.formatOutput(logs),
        error: errorMessage,
        executionTime: Date.now() - startTime,
        logs,
      };
    } finally {
      // Clean up container
      if (container) {
        try {
          await container.remove({ force: true });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }

  private async ensureImage(imageName: string): Promise<void> {
    try {
      await this.docker.getImage(imageName).inspect();
      this.logger.debug(`Image ${imageName} already exists`);
    } catch {
      this.logger.log(`Pulling image ${imageName}...`);
      const stream = await this.docker.pull(imageName);
      await new Promise<void>((resolve, reject) => {
        this.docker.modem.followProgress(stream, (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        });
      });
      this.logger.log(`Image ${imageName} pulled successfully`);
    }
  }

  private parseDockerLogs(buffer: Buffer): { stdout: string; stderr: string } {
    // Docker multiplexes stdout and stderr in the log stream
    // Each frame has an 8-byte header:
    // - byte 0: stream type (0=stdin, 1=stdout, 2=stderr)
    // - bytes 1-3: reserved
    // - bytes 4-7: frame size (big-endian uint32)
    let stdout = '';
    let stderr = '';
    let offset = 0;

    while (offset < buffer.length) {
      if (offset + 8 > buffer.length) break;

      const streamType = buffer[offset];
      const frameSize = buffer.readUInt32BE(offset + 4);
      offset += 8;

      if (offset + frameSize > buffer.length) break;

      const content = buffer.slice(offset, offset + frameSize).toString('utf8');
      offset += frameSize;

      if (streamType === 1) {
        stdout += content;
      } else if (streamType === 2) {
        stderr += content;
      }
    }

    // If parsing failed (no headers), treat entire buffer as stdout
    if (stdout === '' && stderr === '' && buffer.length > 0) {
      stdout = buffer.toString('utf8');
    }

    return { stdout: stdout.trim(), stderr: stderr.trim() };
  }

  private formatOutput(logs: ExecutionLog[]): string {
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

    return outputLines.join('\n');
  }

  private escapeShell(str: string): string {
    // Escape single quotes for shell command
    return str.replace(/'/g, "'\\''");
  }

  async isDockerAvailable(): Promise<boolean> {
    try {
      await this.docker.ping();
      return true;
    } catch {
      return false;
    }
  }

  getSupportedLanguages(): string[] {
    return Object.keys(this.languageConfigs);
  }
}
