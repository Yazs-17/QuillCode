export enum ErrorCode {
  // Success
  SUCCESS = 0,

  // Auth errors (1xxx)
  AUTH_FAILED = 1001,
  TOKEN_EXPIRED = 1002,
  PERMISSION_DENIED = 1003,
  USER_EXISTS = 1004,
  INVALID_CREDENTIALS = 1005,

  // Article errors (2xxx)
  ARTICLE_NOT_FOUND = 2001,
  ARTICLE_CREATE_FAILED = 2002,
  ARTICLE_UPDATE_FAILED = 2003,

  // Execution errors (3xxx)
  EXEC_ERROR = 3001,
  EXEC_TIMEOUT = 3002,
  EXEC_NOT_SUPPORTED = 3003,

  // Share errors (4xxx)
  SHARE_NOT_FOUND = 4001,
  SHARE_EXPIRED = 4002,

  // Tag errors (5xxx)
  TAG_NOT_FOUND = 5001,
  TAG_EXISTS = 5002,

  // System errors (9xxx)
  INTERNAL_ERROR = 9001,
  SERVICE_UNAVAILABLE = 9002,
}

export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.SUCCESS]: 'Success',
  [ErrorCode.AUTH_FAILED]: 'Authentication failed',
  [ErrorCode.TOKEN_EXPIRED]: 'Token has expired',
  [ErrorCode.PERMISSION_DENIED]: 'Permission denied',
  [ErrorCode.USER_EXISTS]: 'User already exists',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid credentials',
  [ErrorCode.ARTICLE_NOT_FOUND]: 'Article not found',
  [ErrorCode.ARTICLE_CREATE_FAILED]: 'Failed to create article',
  [ErrorCode.ARTICLE_UPDATE_FAILED]: 'Failed to update article',
  [ErrorCode.EXEC_ERROR]: 'Code execution error',
  [ErrorCode.EXEC_TIMEOUT]: 'Code execution timeout',
  [ErrorCode.EXEC_NOT_SUPPORTED]: 'Language not supported in current mode',
  [ErrorCode.SHARE_NOT_FOUND]: 'Share link not found',
  [ErrorCode.SHARE_EXPIRED]: 'Share link has expired',
  [ErrorCode.TAG_NOT_FOUND]: 'Tag not found',
  [ErrorCode.TAG_EXISTS]: 'Tag already exists',
  [ErrorCode.INTERNAL_ERROR]: 'Internal server error',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service unavailable',
};
