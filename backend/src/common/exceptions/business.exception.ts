import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorMessages } from '../constants/error-codes';

export class BusinessException extends HttpException {
  constructor(
    code: ErrorCode,
    message?: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        code,
        message: message || ErrorMessages[code] || 'Unknown error',
      },
      status,
    );
  }

  static authFailed(message?: string): BusinessException {
    return new BusinessException(
      ErrorCode.AUTH_FAILED,
      message,
      HttpStatus.UNAUTHORIZED,
    );
  }

  static tokenExpired(message?: string): BusinessException {
    return new BusinessException(
      ErrorCode.TOKEN_EXPIRED,
      message,
      HttpStatus.UNAUTHORIZED,
    );
  }

  static permissionDenied(message?: string): BusinessException {
    return new BusinessException(
      ErrorCode.PERMISSION_DENIED,
      message,
      HttpStatus.FORBIDDEN,
    );
  }

  static userExists(message?: string): BusinessException {
    return new BusinessException(
      ErrorCode.USER_EXISTS,
      message,
      HttpStatus.CONFLICT,
    );
  }

  static invalidCredentials(message?: string): BusinessException {
    return new BusinessException(
      ErrorCode.INVALID_CREDENTIALS,
      message,
      HttpStatus.UNAUTHORIZED,
    );
  }

  static articleNotFound(message?: string): BusinessException {
    return new BusinessException(
      ErrorCode.ARTICLE_NOT_FOUND,
      message,
      HttpStatus.NOT_FOUND,
    );
  }

  static articleCreateFailed(message?: string): BusinessException {
    return new BusinessException(
      ErrorCode.ARTICLE_CREATE_FAILED,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  static articleUpdateFailed(message?: string): BusinessException {
    return new BusinessException(
      ErrorCode.ARTICLE_UPDATE_FAILED,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  static execError(message?: string): BusinessException {
    return new BusinessException(
      ErrorCode.EXEC_ERROR,
      message,
      HttpStatus.BAD_REQUEST,
    );
  }

  static execTimeout(message?: string): BusinessException {
    return new BusinessException(
      ErrorCode.EXEC_TIMEOUT,
      message,
      HttpStatus.REQUEST_TIMEOUT,
    );
  }

  static execNotSupported(message?: string): BusinessException {
    return new BusinessException(
      ErrorCode.EXEC_NOT_SUPPORTED,
      message,
      HttpStatus.BAD_REQUEST,
    );
  }

  static shareNotFound(message?: string): BusinessException {
    return new BusinessException(
      ErrorCode.SHARE_NOT_FOUND,
      message,
      HttpStatus.NOT_FOUND,
    );
  }

  static shareExpired(message?: string): BusinessException {
    return new BusinessException(
      ErrorCode.SHARE_EXPIRED,
      message,
      HttpStatus.GONE,
    );
  }

  static tagNotFound(message?: string): BusinessException {
    return new BusinessException(
      ErrorCode.TAG_NOT_FOUND,
      message,
      HttpStatus.NOT_FOUND,
    );
  }

  static tagExists(message?: string): BusinessException {
    return new BusinessException(
      ErrorCode.TAG_EXISTS,
      message,
      HttpStatus.CONFLICT,
    );
  }

  static internalError(message?: string): BusinessException {
    return new BusinessException(
      ErrorCode.INTERNAL_ERROR,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  static serviceUnavailable(message?: string): BusinessException {
    return new BusinessException(
      ErrorCode.SERVICE_UNAVAILABLE,
      message,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
