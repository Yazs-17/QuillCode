import api from './api'

export const tagService = {
	async getTags () {
		return api.get('/tags')
	},

	async getTagArticles (id) {
		return api.get(`/tags/${id}/articles`)
	},

	async createTag (name) {
		return api.post('/tags', { name })
	}
}
