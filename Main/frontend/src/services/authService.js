import api from './api'

export const authService = {
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
