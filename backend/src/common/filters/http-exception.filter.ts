import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode, ErrorMessages } from '../constants/error-codes';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = ErrorCode.INTERNAL_ERROR;
    let message = ErrorMessages[ErrorCode.INTERNAL_ERROR];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        code = (resp.code as ErrorCode) || this.mapStatusToErrorCode(status);

        // Handle validation errors (class-validator)
        if (Array.isArray(resp.message)) {
          message = resp.message.join(', ');
        } else {
          message =
            (resp.message as string) ||
            ErrorMessages[code] ||
            exception.message;
        }
      } else {
        code = this.mapStatusToErrorCode(status);
        message = ErrorMessages[code] || exception.message;
      }
    } else if (exception instanceof Error) {
      // Handle unexpected errors
      this.logger.error(
        `Unexpected error: ${exception.message}`,
        exception.stack,
      );
      message = 'An unexpected error occurred';
    }

    // Log error details
    this.logger.error(
      `[${request.method}] ${request.url} - ${status} - ${message}`,
    );

    response.status(status).json({
      code,
      message,
      data: null,
      timestamp: Date.now(),
    });
  }

  private mapStatusToErrorCode(status: number): ErrorCode {
    switch (status) {
      case 400:
        return ErrorCode.INTERNAL_ERROR;
      case 401:
        return ErrorCode.AUTH_FAILED;
      case 403:
        return ErrorCode.PERMISSION_DENIED;
      case 404:
        return ErrorCode.ARTICLE_NOT_FOUND;
      case 408:
        return ErrorCode.EXEC_TIMEOUT;
      case 409:
        return ErrorCode.USER_EXISTS;
      case 410:
        return ErrorCode.SHARE_EXPIRED;
      case 503:
        return ErrorCode.SERVICE_UNAVAILABLE;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }
}
