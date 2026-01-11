/**
 * Article Service
 * 
 * Provides article CRUD operations with dual-mode support:
 * - Online mode (VITE_MODE=online): Uses browser storage via DataAdapter
 * - Server mode: Uses REST API
 * 
 * @module services/articleService
 */

import api from './api'
import { getDataAdapter } from './dataAdapter'
import { isOnlineMode } from '../utils/environment'

/**
 * Get current user ID from localStorage
 * In online mode, we use a default user ID for browser storage
 */
const getCurrentUserId = () => {
	// Try to get user from localStorage (set by auth)
	const userStr = localStorage.getItem('user')
	if (userStr) {
		try {
			const user = JSON.parse(userStr)
			return user.id || user.userId
		} catch {
			// Ignore parse errors
		}
	}
	// Default user ID for online demo mode
	return 'demo-user'
}

export const articleService = {
	/**
	 * Get articles with optional pagination
	 */
	async getArticles(params = {}) {
		if (isOnlineMode()) {
			const adapter = getDataAdapter()
			await adapter.initialize()
			const userId = getCurrentUserId()
			const articles = await adapter.getArticlesByUserId(userId, {
				page: params.page,
				limit: params.limit || params.pageSize,
				orderBy: params.orderBy || 'createdAt',
				order: params.order || 'DESC'
			})
			return articles
		}
		return api.get('/articles', { params })
	},

	/**
	 * Get single article by ID
	 */
	async getArticle(id) {
		if (isOnlineMode()) {
			const adapter = getDataAdapter()
			await adapter.initialize()
			const article = await adapter.getArticle(id)
			if (!article) {
				throw { code: 2001, message: '文章不存在' }
			}
			return article
		}
		return api.get(`/articles/${id}`)
	},

	/**
	 * Create a new article
	 */
	async createArticle(data) {
		if (isOnlineMode()) {
			const adapter = getDataAdapter()
			await adapter.initialize()
			const userId = getCurrentUserId()
			
			// Extract tag names from data
			const tagNames = data.tags || []
			
			const article = await adapter.createArticle({
				userId,
				title: data.title,
				content: data.content,
				code: data.code,
				type: data.type || 'snippet',
				language: data.language || 'javascript',
				tags: tagNames
			})
			return article
		}
		return api.post('/articles', data)
	},

	/**
	 * Update an existing article
	 */
	async updateArticle(id, data) {
		if (isOnlineMode()) {
			const adapter = getDataAdapter()
			await adapter.initialize()
			const userId = getCurrentUserId()
			
			const article = await adapter.updateArticle(id, {
				title: data.title,
				content: data.content,
				code: data.code,
				type: data.type,
				language: data.language,
				tags: data.tags
			}, userId)
			return article
		}
		return api.put(`/articles/${id}`, data)
	},

	/**
	 * Delete an article
	 */
	async deleteArticle(id) {
		if (isOnlineMode()) {
			const adapter = getDataAdapter()
			await adapter.initialize()
			await adapter.deleteArticle(id)
			return { success: true }
		}
		return api.delete(`/articles/${id}`)
	},

	/**
	 * Execute code (only available in server mode)
	 */
	async executeCode(id) {
		if (isOnlineMode()) {
			throw { 
				code: 3003, 
				message: '在线试用版不支持代码执行，请下载桌面版' 
			}
		}
		return api.post(`/articles/${id}/execute`)
	},

	/**
	 * Get articles by tag
	 */
	async getArticlesByTag(tagId, params = {}) {
		if (isOnlineMode()) {
			const adapter = getDataAdapter()
			await adapter.initialize()
			const articles = await adapter.getArticlesByTag(tagId, {
				page: params.page,
				limit: params.limit || params.pageSize,
				orderBy: params.orderBy || 'createdAt',
				order: params.order || 'DESC'
			})
			return articles
		}
		return api.get(`/tags/${tagId}/articles`, { params })
	}
}
