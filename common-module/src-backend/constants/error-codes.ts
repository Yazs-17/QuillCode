/**
 * ============================================
 * 错误码定义 - Error Codes
 * ============================================
 * 
 * 📌 作用：统一定义业务错误码
 * 
 * 🔧 自定义指南：
 * - 按业务模块划分错误码范围
 * - 保持错误码唯一性
 * - 添加对应的错误消息
 */

/**
 * 错误码枚举
 * 
 * 规范：
 * - 0: 成功
 * - 1xxx: 认证相关
 * - 2xxx: 资源相关（文章、用户等）
 * - 3xxx: 执行相关
 * - 4xxx: 分享相关
 * - 5xxx: 标签相关
 * - 9xxx: 系统错误
 */
export enum ErrorCode {
	// ===== 成功 =====
	SUCCESS = 0,

	// ===== 认证错误 (1xxx) =====
	AUTH_FAILED = 1001,        // 认证失败
	TOKEN_EXPIRED = 1002,      // Token 过期
	PERMISSION_DENIED = 1003,  // 权限不足
	USER_EXISTS = 1004,        // 用户已存在
	INVALID_CREDENTIALS = 1005, // 用户名或密码错误

	// ===== 资源错误 (2xxx) =====
	ARTICLE_NOT_FOUND = 2001,     // 文章不存在
	ARTICLE_CREATE_FAILED = 2002, // 创建文章失败
	ARTICLE_UPDATE_FAILED = 2003, // 更新文章失败

	// ===== 执行错误 (3xxx) =====
	EXEC_ERROR = 3001,          // 执行错误
	EXEC_TIMEOUT = 3002,        // 执行超时
	EXEC_NOT_SUPPORTED = 3003,  // 不支持的语言

	// ===== 分享错误 (4xxx) =====
	SHARE_NOT_FOUND = 4001,  // 分享链接不存在
	SHARE_EXPIRED = 4002,    // 分享链接已过期

	// ===== 标签错误 (5xxx) =====
	TAG_NOT_FOUND = 5001,  // 标签不存在
	TAG_EXISTS = 5002,     // 标签已存在

	// ===== 系统错误 (9xxx) =====
	INTERNAL_ERROR = 9001,       // 内部错误
	SERVICE_UNAVAILABLE = 9002,  // 服务不可用
}

/**
 * 错误消息映射
 * 
 * 🔧 可以根据需要修改消息内容
 * 🔧 支持国际化：可以改为从 i18n 文件读取
 */
export const ErrorMessages: Record<ErrorCode, string> = {
	[ErrorCode.SUCCESS]: '成功',
	[ErrorCode.AUTH_FAILED]: '认证失败',
	[ErrorCode.TOKEN_EXPIRED]: 'Token 已过期',
	[ErrorCode.PERMISSION_DENIED]: '权限不足',
	[ErrorCode.USER_EXISTS]: '用户已存在',
	[ErrorCode.INVALID_CREDENTIALS]: '用户名或密码错误',
	[ErrorCode.ARTICLE_NOT_FOUND]: '文章不存在',
	[ErrorCode.ARTICLE_CREATE_FAILED]: '创建文章失败',
	[ErrorCode.ARTICLE_UPDATE_FAILED]: '更新文章失败',
	[ErrorCode.EXEC_ERROR]: '代码执行错误',
	[ErrorCode.EXEC_TIMEOUT]: '代码执行超时',
	[ErrorCode.EXEC_NOT_SUPPORTED]: '不支持的编程语言',
	[ErrorCode.SHARE_NOT_FOUND]: '分享链接不存在',
	[ErrorCode.SHARE_EXPIRED]: '分享链接已过期',
	[ErrorCode.TAG_NOT_FOUND]: '标签不存在',
	[ErrorCode.TAG_EXISTS]: '标签已存在',
	[ErrorCode.INTERNAL_ERROR]: '服务器内部错误',
	[ErrorCode.SERVICE_UNAVAILABLE]: '服务暂时不可用',
};
