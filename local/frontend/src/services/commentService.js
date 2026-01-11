import api from './api'

export const commentService = {
	async getComments (shareToken) {
		return api.get(`/shares/${shareToken}/comments`)
	},

	async addComment (shareToken, authorName, content) {
		return api.post(`/shares/${shareToken}/comments`, { authorName, content })
	}
}
