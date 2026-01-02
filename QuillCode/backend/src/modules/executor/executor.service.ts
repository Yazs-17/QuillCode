import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SandboxExecutor } from './sandbox.executor';
import { DockerExecutor } from './docker.executor';
import { ExecuteCodeDto, ExecutionResult } from './dto';
import { ErrorCode, ErrorMessages } from '../../common';

@Injectable()
export class ExecutorService {
  private readonly logger = new Logger(ExecutorService.name);
  private readonly appMode: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly sandboxExecutor: SandboxExecutor,
    private readonly dockerExecutor: DockerExecutor,
  ) {
    this.appMode = this.configService.get<string>('app.mode') || 'dev';
  }

  async execute(executeCodeDto: ExecuteCodeDto): Promise<ExecutionResult> {
    const { code, language, input } = executeCodeDto;

    // Validate language support based on mode
    if (this.appMode === 'prod') {
      if (!['javascript', 'typescript'].includes(language)) {
        throw new HttpException(
          {
            code: ErrorCode.EXEC_NOT_SUPPORTED,
            message: `${ErrorMessages[ErrorCode.EXEC_NOT_SUPPORTED]}: ${language} is not available in production mode`,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    try {
      // In prod mode, always use sandbox executor
      if (this.appMode === 'prod') {
        return await this.sandboxExecutor.execute(code, language);
      }

      // In dev mode for JS/TS, use sandbox executor (faster)
      if (['javascript', 'typescript'].includes(language)) {
        return await this.sandboxExecutor.execute(code, language);
      }

      // In dev mode for other languages, use Docker executor
      const dockerAvailable = await this.dockerExecutor.isDockerAvailable();
      if (!dockerAvailable) {
        this.logger.warn('Docker is not available, falling back to error');
        throw new HttpException(
          {
            code: ErrorCode.EXEC_NOT_SUPPORTED,
            message: `Docker is not available. Please ensure Docker is running to execute ${language} code.`,
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      return await this.dockerExecutor.execute(code, language, input);
    } catch (error) {
      // Re-throw HttpExceptions
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle timeout errors
      if (error instanceof Error && error.message.includes('timeout')) {
        throw new HttpException(
          {
            code: ErrorCode.EXEC_TIMEOUT,
            message: ErrorMessages[ErrorCode.EXEC_TIMEOUT],
          },
          HttpStatus.REQUEST_TIMEOUT,
        );
      }

      // Handle other execution errors
      throw new HttpException(
        {
          code: ErrorCode.EXEC_ERROR,
          message: error instanceof Error ? error.message : 'Unknown execution error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  getAppMode(): string {
    return this.appMode;
  }

  getSupportedLanguages(): string[] {
    if (this.appMode === 'prod') {
      return ['javascript', 'typescript'];
    }
    return ['javascript', 'typescript', 'python', 'java'];
  }
}
