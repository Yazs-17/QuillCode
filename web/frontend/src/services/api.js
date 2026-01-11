import axios from 'axios'
import router from '../router'
import { useUiStore } from '../stores/ui'

// Error code constants (matching backend)
export const ErrorCode = {
	SUCCESS: 0,
	AUTH_FAILED: 1001,
	TOKEN_EXPIRED: 1002,
	PERMISSION_DENIED: 1003,
	USER_EXISTS: 1004,
	INVALID_CREDENTIALS: 1005,
	ARTICLE_NOT_FOUND: 2001,
	ARTICLE_CREATE_FAILED: 2002,
	ARTICLE_UPDATE_FAILED: 2003,
	EXEC_ERROR: 3001,
	EXEC_TIMEOUT: 3002,
	EXEC_NOT_SUPPORTED: 3003,
	SHARE_NOT_FOUND: 4001,
	SHARE_EXPIRED: 4002,
	TAG_NOT_FOUND: 5001,
	TAG_EXISTS: 5002,
	INTERNAL_ERROR: 9001,
	SERVICE_UNAVAILABLE: 9002
}

// Error messages for user display
const ErrorMessages = {
	[ErrorCode.AUTH_FAILED]: '认证失败',
	[ErrorCode.TOKEN_EXPIRED]: '登录已过期，请重新登录',
	[ErrorCode.PERMISSION_DENIED]: '没有权限执行此操作',
	[ErrorCode.USER_EXISTS]: '用户已存在',
	[ErrorCode.INVALID_CREDENTIALS]: '用户名或密码错误',
	[ErrorCode.ARTICLE_NOT_FOUND]: '文章不存在',
	[ErrorCode.ARTICLE_CREATE_FAILED]: '创建文章失败',
	[ErrorCode.ARTICLE_UPDATE_FAILED]: '更新文章失败',
	[ErrorCode.EXEC_ERROR]: '代码执行错误',
	[ErrorCode.EXEC_TIMEOUT]: '代码执行超时',
	[ErrorCode.EXEC_NOT_SUPPORTED]: '当前模式不支持该语言',
	[ErrorCode.SHARE_NOT_FOUND]: '分享链接不存在',
	[ErrorCode.SHARE_EXPIRED]: '分享链接已过期',
	[ErrorCode.TAG_NOT_FOUND]: '标签不存在',
	[ErrorCode.TAG_EXISTS]: '标签已存在',
	[ErrorCode.INTERNAL_ERROR]: '服务器内部错误',
	[ErrorCode.SERVICE_UNAVAILABLE]: '服务暂时不可用'
}

const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL || '/api',
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json'
	}
})

// Request interceptor - add JWT token
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('token')
		if (token) {
			config.headers.Authorization = `Bearer ${token}`
		}
		return config
	},
	(error) => {
		return Promise.reject(error)
	}
)

// Response interceptor - handle errors
api.interceptors.response.use(
	(response) => {
		// Backend wraps response in { code, message, data, timestamp }
		// Extract the actual data
		const result = response.data
		if (result && typeof result === 'object' && 'data' in result) {
			return result.data
		}
		return result
	},
	(error) => {
		const { response } = error
		let uiStore = null

		// Try to get UI store (may not be available during app initialization)
		try {
			uiStore = useUiStore()
		} catch (e) {
			// Store not available yet
		}

		if (response) {
			const { code, message } = response.data || {}
			const errorCode = code || response.status
			const errorMessage = message || ErrorMessages[errorCode] || '请求失败'

			// Token expired - redirect to login
			if (code === ErrorCode.TOKEN_EXPIRED || response.status === 401) {
				localStorage.removeItem('token')
				if (uiStore) {
					uiStore.showToast('登录已过期，请重新登录', 'warning')
				}
				router.push({ name: 'Login' })
			} else if (uiStore) {
				// Show error toast for other errors
				uiStore.showToast(errorMessage, 'error')
			}

			// Return structured error
			return Promise.reject({
				code: errorCode,
				message: errorMessage
			})
		}

		// Network error
		if (uiStore) {
			uiStore.showToast('网络连接失败，请检查网络', 'error')
		}
		return Promise.reject({
			code: -1,
			message: '网络连接失败'
		})
	}
)

export default api
