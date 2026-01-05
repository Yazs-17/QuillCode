/**
 * ============================================
 * 认证服务 - Auth Service (前端)
 * ============================================
 * 
 * 📌 作用：封装认证相关的 API 调用
 * 📌 框架：原生 JavaScript (可适配任何框架)
 * 
 * 🔧 自定义指南：
 * - 修改 API_BASE_URL 为你的后端地址
 * - 添加更多 API 方法
 * - 集成到 Pinia/Vuex 状态管理
 */

// ========== 配置 ==========

/**
 * API 基础地址
 * 
 * 🔧 修改为你的后端地址：
 * - 开发环境：http://localhost:3000
 * - 生产环境：https://api.yourdomain.com
 */
const API_BASE_URL = '/auth'  // 使用 Vite 代理

/**
 * Token 存储的 key
 */
const TOKEN_KEY = 'token'

// ========== 工具函数 ==========

/**
 * 发送 HTTP 请求
 * 
 * @param {string} url - 请求地址
 * @param {object} options - 请求选项
 * @returns {Promise<any>} 响应数据
 */
async function request (url, options = {}) {
	const token = localStorage.getItem(TOKEN_KEY)

	const config = {
		headers: {
			'Content-Type': 'application/json',
			// 如果有 token，添加到请求头
			...(token ? { 'Authorization': `Bearer ${token}` } : {}),
			...options.headers,
		},
		...options,
	}

	const response = await fetch(`${API_BASE_URL}${url}`, config)
	const data = await response.json()

	if (!response.ok) {
		// 处理错误响应
		throw new Error(data.message || '请求失败')
	}

	return data
}

// ========== API 方法 ==========

export const authService = {
	/**
	 * ========================================
	 * 用户注册
	 * ========================================
	 * 
	 * @param {object} data - 注册信息
	 * @param {string} data.username - 用户名
	 * @param {string} data.email - 邮箱
	 * @param {string} data.password - 密码
	 * @returns {Promise<{user: object}>} 新用户信息
	 * 
	 * 使用示例：
	 * const result = await authService.register({
	 *   username: 'john',
	 *   email: 'john@test.com',
	 *   password: '123456'
	 * })
	 */
	async register (data) {
		return request('/register', {
			method: 'POST',
			body: JSON.stringify(data),
		})
	},

	/**
	 * ========================================
	 * 用户登录
	 * ========================================
	 * 
	 * @param {object} data - 登录信息
	 * @param {string} data.username - 用户名
	 * @param {string} data.password - 密码
	 * @returns {Promise<{accessToken: string, user: object}>}
	 * 
	 * 使用示例：
	 * const result = await authService.login({
	 *   username: 'john',
	 *   password: '123456'
	 * })
	 * // result.accessToken 就是 JWT token
	 */
	async login (data) {
		const result = await request('/login', {
			method: 'POST',
			body: JSON.stringify(data),
		})

		// 保存 token 到 localStorage
		if (result.accessToken) {
			localStorage.setItem(TOKEN_KEY, result.accessToken)
		}

		return result
	},

	/**
	 * ========================================
	 * 获取当前用户信息
	 * ========================================
	 * 
	 * ⚠️ 需要先登录（需要 token）
	 * 
	 * @returns {Promise<object>} 用户信息
	 * 
	 * 使用示例：
	 * const profile = await authService.getProfile()
	 */
	async getProfile () {
		return request('/profile')
	},

	/**
	 * ========================================
	 * 退出登录
	 * ========================================
	 * 
	 * 清除本地存储的 token
	 */
	logout () {
		localStorage.removeItem(TOKEN_KEY)
	},

	/**
	 * ========================================
	 * 检查是否已登录
	 * ========================================
	 * 
	 * @returns {boolean}
	 */
	isLoggedIn () {
		return !!localStorage.getItem(TOKEN_KEY)
	},

	/**
	 * ========================================
	 * 获取当前 token
	 * ========================================
	 * 
	 * @returns {string|null}
	 */
	getToken () {
		return localStorage.getItem(TOKEN_KEY)
	},

	// ========================================
	// 🔧 可扩展方法示例
	// ========================================

	/**
	 * 修改密码（示例）
	 * 
	 * async changePassword(oldPassword, newPassword) {
	 *   return request('/change-password', {
	 *     method: 'POST',
	 *     body: JSON.stringify({ oldPassword, newPassword }),
	 *   })
	 * }
	 */

	/**
	 * 刷新 Token（示例）
	 * 
	 * async refreshToken() {
	 *   const result = await request('/refresh', { method: 'POST' })
	 *   if (result.accessToken) {
	 *     localStorage.setItem(TOKEN_KEY, result.accessToken)
	 *   }
	 *   return result
	 * }
	 */
}
