/**
 * ============================================
 * 认证服务 - Auth Service (前端源码)
 * ============================================
 * 
 * 📌 作用：封装认证相关的 API 调用
 * 📌 适用：Vue 3 / React / 原生 JS
 * 
 * 🔧 集成步骤：
 * 1. 复制此文件到你的项目
 * 2. 修改 API_BASE_URL 为你的后端地址
 * 3. 在组件中导入使用
 * 
 * 使用示例：
 * import { authService } from '@/services/auth.service'
 * 
 * // 登录
 * const result = await authService.login({ username: 'john', password: '123456' })
 * 
 * // 获取用户信息
 * const profile = await authService.getProfile()
 */

// ========================================
// 配置区域 - 根据你的项目修改
// ========================================

/**
 * API 基础地址
 * 
 * 🔧 修改为你的后端地址：
 * - 开发环境：'http://localhost:3000/auth'
 * - 生产环境：'https://api.yourdomain.com/auth'
 * - 使用代理：'/api/auth'
 */
const API_BASE_URL = '/auth'

/**
 * Token 存储的 key
 * 可以修改为你喜欢的名称
 */
const TOKEN_KEY = 'access_token'

/**
 * 用户信息存储的 key（可选）
 */
const USER_KEY = 'user_info'

// ========================================
// HTTP 请求封装
// ========================================

/**
 * 发送 HTTP 请求
 * 
 * 🔧 如果你使用 axios，可以替换为：
 * import axios from 'axios'
 * const api = axios.create({ baseURL: API_BASE_URL })
 * api.interceptors.request.use(config => {
 *   const token = localStorage.getItem(TOKEN_KEY)
 *   if (token) config.headers.Authorization = `Bearer ${token}`
 *   return config
 * })
 */
async function request (url, options = {}) {
	const token = localStorage.getItem(TOKEN_KEY)

	const config = {
		headers: {
			'Content-Type': 'application/json',
			...(token ? { 'Authorization': `Bearer ${token}` } : {}),
			...options.headers,
		},
		...options,
	}

	try {
		const response = await fetch(`${API_BASE_URL}${url}`, config)
		const data = await response.json()

		if (!response.ok) {
			// 401 错误：token 过期或无效
			if (response.status === 401) {
				authService.logout()
				// 🔧 可以在这里触发跳转到登录页
				// window.location.href = '/login'
			}
			throw new Error(data.message || `请求失败: ${response.status}`)
		}

		return data
	} catch (error) {
		console.error('API 请求错误:', error)
		throw error
	}
}

// ========================================
// 认证服务 API
// ========================================

export const authService = {
	/**
	 * 用户注册
	 * 
	 * @param {object} data - 注册信息
	 * @param {string} data.username - 用户名 (3-20字符)
	 * @param {string} data.email - 邮箱
	 * @param {string} data.password - 密码 (至少6字符)
	 * @returns {Promise<{user: object}>}
	 * 
	 * @example
	 * try {
	 *   const result = await authService.register({
	 *     username: 'john',
	 *     email: 'john@example.com',
	 *     password: '123456'
	 *   })
	 *   console.log('注册成功:', result.user)
	 * } catch (error) {
	 *   console.error('注册失败:', error.message)
	 * }
	 */
	async register (data) {
		return request('/register', {
			method: 'POST',
			body: JSON.stringify(data),
		})
	},

	/**
	 * 用户登录
	 * 
	 * @param {object} data - 登录信息
	 * @param {string} data.username - 用户名
	 * @param {string} data.password - 密码
	 * @returns {Promise<{accessToken: string, user: object}>}
	 * 
	 * @example
	 * try {
	 *   const result = await authService.login({
	 *     username: 'john',
	 *     password: '123456'
	 *   })
	 *   console.log('登录成功:', result.user)
	 *   console.log('Token:', result.accessToken)
	 * } catch (error) {
	 *   console.error('登录失败:', error.message)
	 * }
	 */
	async login (data) {
		const result = await request('/login', {
			method: 'POST',
			body: JSON.stringify(data),
		})

		// 保存 token 和用户信息
		if (result.accessToken) {
			localStorage.setItem(TOKEN_KEY, result.accessToken)
		}
		if (result.user) {
			localStorage.setItem(USER_KEY, JSON.stringify(result.user))
		}

		return result
	},

	/**
	 * 获取当前用户信息
	 * 
	 * ⚠️ 需要先登录
	 * 
	 * @returns {Promise<object>} 用户详细信息
	 * 
	 * @example
	 * const profile = await authService.getProfile()
	 * console.log('用户信息:', profile)
	 */
	async getProfile () {
		return request('/profile')
	},

	/**
	 * 退出登录
	 * 
	 * 清除本地存储的 token 和用户信息
	 */
	logout () {
		localStorage.removeItem(TOKEN_KEY)
		localStorage.removeItem(USER_KEY)
	},

	/**
	 * 检查是否已登录
	 * 
	 * @returns {boolean}
	 */
	isLoggedIn () {
		return !!localStorage.getItem(TOKEN_KEY)
	},

	/**
	 * 获取当前 token
	 * 
	 * @returns {string|null}
	 */
	getToken () {
		return localStorage.getItem(TOKEN_KEY)
	},

	/**
	 * 获取缓存的用户信息
	 * 
	 * @returns {object|null}
	 */
	getCachedUser () {
		const userStr = localStorage.getItem(USER_KEY)
		return userStr ? JSON.parse(userStr) : null
	},
}

// ========================================
// 🔧 Vue 3 Composable 示例
// ========================================

/**
 * Vue 3 组合式 API 封装
 * 
 * 使用示例：
 * import { useAuth } from '@/services/auth.service'
 * 
 * const { user, isLoggedIn, login, logout } = useAuth()
 */
export function useAuth () {
	// 如果使用 Vue 3，取消下面的注释
	// import { ref, computed } from 'vue'
	// 
	// const user = ref(authService.getCachedUser())
	// const isLoggedIn = computed(() => authService.isLoggedIn())
	// 
	// const login = async (data) => {
	//   const result = await authService.login(data)
	//   user.value = result.user
	//   return result
	// }
	// 
	// const logout = () => {
	//   authService.logout()
	//   user.value = null
	// }
	// 
	// const fetchProfile = async () => {
	//   user.value = await authService.getProfile()
	// }
	// 
	// return { user, isLoggedIn, login, logout, fetchProfile }
}

// ========================================
// 🔧 React Hook 示例
// ========================================

/**
 * React Hook 封装
 *
 * 使用示例：
 * import { useAuth } from '@/services/auth.service'
 *
 * function App() {
 *   const { user, isLoggedIn, login, logout } = useAuth()
 *   // ...
 * }
 */
// export function useAuth() {
//   const [user, setUser] = useState(authService.getCachedUser())
//
//   const login = async (data) => {
//     const result = await authService.login(data)
//     setUser(result.user)
//     return result
//   }
//
//   const logout = () => {
//     authService.logout()
//     setUser(null)
//   }
//
//   return { user, isLoggedIn: !!user, login, logout }
// }
