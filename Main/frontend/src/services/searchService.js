import api from './api'

export const searchService = {
	async search (query) {
		return api.get('/search', { params: { q: query } })
	},

	async getStatus () {
		return api.get('/search/status')
	},

	async getRecommendations (articleId) {
		return api.get(`/search/recommend`, { params: { articleId } })
	}
}
