import api from './api'

export const articleService = {
	async getArticles (params = {}) {
		return api.get('/articles', { params })
	},

	async getArticle (id) {
		return api.get(`/articles/${id}`)
	},

	async createArticle (data) {
		return api.post('/articles', data)
	},

	async updateArticle (id, data) {
		return api.put(`/articles/${id}`, data)
	},

	async deleteArticle (id) {
		return api.delete(`/articles/${id}`)
	},

	async executeCode (id) {
		return api.post(`/articles/${id}/execute`)
	}
}
