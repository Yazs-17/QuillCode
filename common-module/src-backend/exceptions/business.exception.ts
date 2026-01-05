/**
 * ============================================
 * 业务异常类 - Business Exception
 * ============================================
 * 
 * 📌 作用：统一的业务异常处理
 * 📌 优点：
 *   - 携带错误码，便于前端处理
 *   - 静态工厂方法，使用方便
 *   - 与 HttpExceptionFilter 配合使用
 * 
 * 🔧 使用示例：
 * // 方式1：静态工厂方法
 * throw BusinessException.authFailed('Token 已过期');
 * 
 * // 方式2：直接构造
 * throw new BusinessException(ErrorCode.USER_EXISTS, '用户已存在');
 */

import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorMessages } from '../constants/error-codes';

export class BusinessException extends HttpException {
	/**
	 * 构造函数
	 * 
	 * @param code - 错误码
	 * @param message - 错误消息（可选，默认使用 ErrorMessages 中的消息）
	 * @param status - HTTP 状态码（可选，默认 400）
	 */
	constructor(
		code: ErrorCode,
		message?: string,
		status: HttpStatus = HttpStatus.BAD_REQUEST,
	) {
		super(
			{
				code,
				message: message || ErrorMessages[code] || '未知错误',
			},
			status,
		);
	}

	// ========================================
	// 认证相关异常
	// ========================================

	/** 认证失败 */
	static authFailed(message?: string): BusinessException {
		return new BusinessException(ErrorCode.AUTH_FAILED, message, HttpStatus.UNAUTHORIZED);
	}

	/** Token 过期 */
	static tokenExpired(message?: string): BusinessException {
		return new BusinessException(ErrorCode.TOKEN_EXPIRED, message, HttpStatus.UNAUTHORIZED);
	}

	/** 权限不足 */
	static permissionDenied(message?: string): BusinessException {
		return new BusinessException(ErrorCode.PERMISSION_DENIED, message, HttpStatus.FORBIDDEN);
	}

	/** 用户已存在 */
	static userExists(message?: string): BusinessException {
		return new BusinessException(ErrorCode.USER_EXISTS, message, HttpStatus.CONFLICT);
	}

	/** 用户名或密码错误 */
	static invalidCredentials(message?: string): BusinessException {
		return new BusinessException(ErrorCode.INVALID_CREDENTIALS, message, HttpStatus.UNAUTHORIZED);
	}

	// ========================================
	// 资源相关异常
	// ========================================

	/** 文章不存在 */
	static articleNotFound(message?: string): BusinessException {
		return new BusinessException(ErrorCode.ARTICLE_NOT_FOUND, message, HttpStatus.NOT_FOUND);
	}

	/** 标签不存在 */
	static tagNotFound(message?: string): BusinessException {
		return new BusinessException(ErrorCode.TAG_NOT_FOUND, message, HttpStatus.NOT_FOUND);
	}

	/** 标签已存在 */
	static tagExists(message?: string): BusinessException {
		return new BusinessException(ErrorCode.TAG_EXISTS, message, HttpStatus.CONFLICT);
	}

	// ========================================
	// 执行相关异常
	// ========================================

	/** 执行错误 */
	static execError(message?: string): BusinessException {
		return new BusinessException(ErrorCode.EXEC_ERROR, message, HttpStatus.BAD_REQUEST);
	}

	/** 执行超时 */
	static execTimeout(message?: string): BusinessException {
		return new BusinessException(ErrorCode.EXEC_TIMEOUT, message, HttpStatus.REQUEST_TIMEOUT);
	}

	// ========================================
	// 系统相关异常
	// ========================================

	/** 内部错误 */
	static internalError(message?: string): BusinessException {
		return new BusinessException(ErrorCode.INTERNAL_ERROR, message, HttpStatus.INTERNAL_SERVER_ERROR);
	}

	/** 服务不可用 */
	static serviceUnavailable(message?: string): BusinessException {
		return new BusinessException(ErrorCode.SERVICE_UNAVAILABLE, message, HttpStatus.SERVICE_UNAVAILABLE);
	}
}
