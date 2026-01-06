import api from './api'

export const shareService = {
	async createShare (articleId, expiresInDays = 7) {
		return api.post('/shares', { articleId, expiresInDays })
	},

	async getShareByToken (token) {
		return api.get(`/shares/${token}`)
	},

	async getMyShares () {
		return api.get('/shares')
	},

	async deleteShare (id) {
		return api.delete(`/shares/${id}`)
	}
}
