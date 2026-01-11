/**
 * Tag Service
 * 
 * Provides tag CRUD operations with dual-mode support:
 * - Online mode (VITE_MODE=online): Uses browser storage via DataAdapter
 * - Server mode: Uses REST API
 * 
 * @module services/tagService
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

export const tagService = {
	/**
	 * Get all tags for current user
	 */
	async getTags(params = {}) {
		if (isOnlineMode()) {
			const adapter = getDataAdapter()
			await adapter.initialize()
			const userId = getCurrentUserId()
			const tags = await adapter.getTagsByUserId(userId, {
				page: params.page,
				limit: params.limit,
				orderBy: params.orderBy || 'name',
				order: params.order || 'ASC'
			})
			return tags
		}
		return api.get('/tags')
	},

	/**
	 * Get articles by tag ID
	 */
	async getTagArticles(id, params = {}) {
		if (isOnlineMode()) {
			const adapter = getDataAdapter()
			await adapter.initialize()
			const articles = await adapter.getArticlesByTag(id, {
				page: params.page,
				limit: params.limit || params.pageSize,
				orderBy: params.orderBy || 'createdAt',
				order: params.order || 'DESC'
			})
			return articles
		}
		return api.get(`/tags/${id}/articles`, { params })
	},

	/**
	 * Create a new tag
	 */
	async createTag(name, color) {
		if (isOnlineMode()) {
			const adapter = getDataAdapter()
			await adapter.initialize()
			const userId = getCurrentUserId()
			const tag = await adapter.createTag(name, userId, color)
			return tag
		}
		return api.post('/tags', { name, color })
	},

	/**
	 * Delete a tag
	 */
	async deleteTag(id) {
		if (isOnlineMode()) {
			const adapter = getDataAdapter()
			await adapter.initialize()
			await adapter.deleteTag(id)
			return { success: true }
		}
		return api.delete(`/tags/${id}`)
	},

	/**
	 * Get single tag by ID
	 */
	async getTag(id) {
		if (isOnlineMode()) {
			const adapter = getDataAdapter()
			await adapter.initialize()
			const tag = await adapter.getTag(id)
			if (!tag) {
				throw { code: 5001, message: '标签不存在' }
			}
			return tag
		}
		return api.get(`/tags/${id}`)
	}
}
