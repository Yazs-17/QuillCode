import api from './api'

export const authService = {
	/**
	 * Get authentication mode information
	 * Returns whether single-user mode is enabled and if password protection is active
	 */
	async getAuthMode () {
		return api.get('/auth/mode')
	},

	/**
	 * Login for single-user mode (password-free or with local password)
	 */
	async localLogin (password) {
		return api.post('/auth/local-login', { password })
	},

	async register (username, email, password) {
		return api.post('/auth/register', { username, email, password })
	},

	async login (username, password) {
		return api.post('/auth/login', { username, password })
	},

	async getProfile () {
		return api.get('/auth/profile')
	}
}
