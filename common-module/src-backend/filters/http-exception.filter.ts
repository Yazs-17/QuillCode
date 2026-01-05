/**
 * ============================================
 * HTTP 异常过滤器 - HTTP Exception Filter
 * ============================================
 * 
 * 📌 作用：捕获所有异常，统一响应格式
 * 📌 使用：在 main.ts 中全局注册
 * 
 * app.useGlobalFilters(new HttpExceptionFilter());
 */

import {
	ExceptionFilter,
	Catch,
	ArgumentsHost,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ErrorCode, ErrorMessages } from '../constants/error-codes';

@Catch()  // 捕获所有异常
export class HttpExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(HttpExceptionFilter.name);

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();

		// 默认值
		let status = HttpStatus.INTERNAL_SERVER_ERROR;
		let code = ErrorCode.INTERNAL_ERROR;
		let message = ErrorMessages[ErrorCode.INTERNAL_ERROR];

		// ===== 处理 HttpException =====
		if (exception instanceof HttpException) {
			status = exception.getStatus();
			const exceptionResponse = exception.getResponse();

			if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
				const resp = exceptionResponse as Record<string, unknown>;

				// 提取错误码
				code = (resp.code as ErrorCode) || this.mapStatusToErrorCode(status);

				// 处理 class-validator 的验证错误（数组形式）
				if (Array.isArray(resp.message)) {
					message = resp.message.join(', ');
				} else {
					message = (resp.message as string) || ErrorMessages[code] || exception.message;
				}
			} else {
				code = this.mapStatusToErrorCode(status);
				message = ErrorMessages[code] || exception.message;
			}
		}
		// ===== 处理未知错误 =====
		else if (exception instanceof Error) {
			this.logger.error(`未捕获的错误: ${exception.message}`, exception.stack);
			message = '服务器内部错误';
		}

		// 记录错误日志
		this.logger.error(`[${request.method}] ${request.url} - ${status} - ${message}`);

		// 返回统一格式的错误响应
		response.status(status).json({
			code,
			message,
			data: null,
			timestamp: Date.now(),
		});
	}

	/**
	 * 将 HTTP 状态码映射到错误码
	 */
	private mapStatusToErrorCode(status: number): ErrorCode {
		switch (status) {
			case 400: return ErrorCode.INTERNAL_ERROR;
			case 401: return ErrorCode.AUTH_FAILED;
			case 403: return ErrorCode.PERMISSION_DENIED;
			case 404: return ErrorCode.ARTICLE_NOT_FOUND;
			case 408: return ErrorCode.EXEC_TIMEOUT;
			case 409: return ErrorCode.USER_EXISTS;
			case 503: return ErrorCode.SERVICE_UNAVAILABLE;
			default: return ErrorCode.INTERNAL_ERROR;
		}
	}
}
