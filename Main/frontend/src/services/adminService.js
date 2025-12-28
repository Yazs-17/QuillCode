import api from './api'

export const adminService = {
	// 获取全站统计
	async getSiteStats () {
		return api.get('/admin/stats')
	},

	// 【视图】获取用户统计列表（v_user_statistics）
	async getUserStatistics () {
		return api.get('/admin/users/statistics')
	},

	// 【存储过程】获取指定用户统计（sp_get_user_stats）
	async getUserStatsById (userId) {
		return api.get(`/admin/users/${userId}/stats`)
	},

	// 【存储过程】获取用户文章列表（sp_get_user_articles）
	async getUserArticles (userId, page = 1, pageSize = 10, type = '') {
		return api.get(`/admin/users/${userId}/articles`, {
			params: { page, pageSize, type }
		})
	},

	// 【视图】获取热门标签（v_popular_tags）
	async getPopularTags (limit = 20) {
		return api.get('/admin/tags/popular', { params: { limit } })
	},

	// 【视图】获取文章详情列表（v_article_details）
	async getArticleDetails (limit = 50) {
		return api.get('/admin/articles/details', { params: { limit } })
	},

	// 获取操作日志（触发器记录）
	async getOperationLogs (page = 1, pageSize = 20) {
		return api.get('/admin/logs', { params: { page, pageSize } })
	},

	// 【存储过程】清理过期分享（sp_cleanup_expired_shares）
	async cleanupExpiredShares () {
		return api.post('/admin/cleanup/shares')
	}
}
